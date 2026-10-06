import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import {
  STEP_MILESTONES,
  milestonesReached,
  newlyUnlocked,
  type StepMilestone,
  runStats,
} from '../utils/steps';

/**
 * Steps + running + water data layer.
 *
 * Design rules:
 * - Local calendar day (NOT UTC) everywhere, so "today" matches what the user sees.
 * - Optimistic local cache in AsyncStorage: the UI paints instantly, works
 *   while signed out, and reconciles with Supabase when a session exists.
 * - Achievements unlock exactly once ever (`achievements` unique on user+code).
 */

// ------------------------------------------------------------- day helpers --

/** YYYY-MM-DD in the device's local timezone. */
export function localDayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayKeyOffset(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return localDayKey(d);
}

/** Inclusive list of the last `count` day keys, oldest first. */
export function lastNDays(count: number, from: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => dayKeyOffset(i - (count - 1), from));
}

function startOfLocalDayIso(key: string): string {
  return new Date(`${key}T00:00:00`).toISOString();
}

// ------------------------------------------------------------ local cache --

const CACHE_KEY = 'fitlife360:activityCache';

export interface DayActivity {
  date: string;
  steps: number;
  waterMl: number;
  runKm: number;
  runMin: number;
  runCalories: number;
  /** Size of the newest step log — lets Undo work without a server. */
  lastStep?: number;
  /** Amount of the newest water log. */
  lastWaterMl?: number;
}

interface CacheShape {
  days: Record<string, DayActivity>;
  unlocked: string[];
}

function emptyDay(date: string): DayActivity {
  return { date, steps: 0, waterMl: 0, runKm: 0, runMin: 0, runCalories: 0 };
}

export async function readCache(): Promise<CacheShape> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return { days: {}, unlocked: [] };
    const parsed = JSON.parse(raw) as CacheShape;
    return { days: parsed.days ?? {}, unlocked: parsed.unlocked ?? [] };
  } catch {
    return { days: {}, unlocked: [] };
  }
}

export async function writeCache(c: CacheShape): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export async function cachedDay(date = localDayKey()): Promise<DayActivity> {
  const c = await readCache();
  return c.days[date] ?? emptyDay(date);
}

async function mutateDay(
  date: string,
  patch: Partial<Omit<DayActivity, 'date'>>,
): Promise<DayActivity> {
  const c = await readCache();
  const next = { ...(c.days[date] ?? emptyDay(date)), ...patch, date };
  c.days[date] = next;
  // keep the cache small — 45 days is plenty for the graphs
  const keep = new Set(lastNDays(45));
  c.days = Object.fromEntries(Object.entries(c.days).filter(([k]) => keep.has(k)));
  await writeCache(c);
  return next;
}

export async function cachedDays(count = 14): Promise<DayActivity[]> {
  const c = await readCache();
  return lastNDays(count).map((d) => c.days[d] ?? emptyDay(d));
}

export async function cachedAchievements(): Promise<string[]> {
  return (await readCache()).unlocked;
}

// ------------------------------------------------------------- session aid --

async function currentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ steps --

export interface AddStepsResult {
  today: DayActivity;
  /** Milestones crossed by this exact log — drive the celebration popup. */
  unlocked: StepMilestone[];
}

/**
 * Add steps to today.
 *
 * Returns `unlocked` = the single HIGHEST badge this log crossed, so the UI
 * fires one celebration instead of a queue. Lower badges crossed at the same
 * moment are still banked silently (and `unlocked` on the cache keeps them).
 */
export async function addSteps(amount: number, source: 'manual' | 'health' | 'import' = 'manual'): Promise<AddStepsResult> {
  const steps = Math.round(amount);
  if (!Number.isFinite(steps) || steps <= 0) throw new Error('Enter at least 1 step.');
  if (steps > 100000) throw new Error('That is over 100,000 steps — check the number.');

  const date = localDayKey();
  const before = (await cachedDay(date)).steps;
  const today = await mutateDay(date, { steps: before + steps, lastStep: steps });

  const already = await cachedAchievements();
  const crossed = newlyUnlocked(before, today.steps, already);
  const unlocked = crossed.length ? [crossed[crossed.length - 1]] : [];

  // Bank every crossed badge, but only celebrate the top one.
  const cache = await readCache();
  cache.unlocked = [...new Set([...cache.unlocked, ...crossed.map((m) => m.code)])];
  await writeCache(cache);

  const userId = await currentUserId();
  if (userId) {
    const { error } = await supabase
      .from('step_logs')
      .insert({ user_id: userId, log_date: date, steps, source });
    if (error) throw error;
    for (const m of crossed) {
      // ignore unique-violation: an earlier session may have unlocked it
      await supabase.from('achievements').upsert(
        { user_id: userId, code: m.code, log_date: date },
        { onConflict: 'user_id,code', ignoreDuplicates: true },
      );
    }
  }
  return { today, unlocked };
}

/** Remove the most recent step log for today (server) and subtract it. */
export async function undoLastSteps(): Promise<DayActivity> {
  const date = localDayKey();
  const userId = await currentUserId();
  if (userId) {
    const { data } = await supabase
      .from('step_logs')
      .select('id, steps')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('logged_at', { ascending: false })
      .limit(1);
    const last = (data ?? [])[0] as { id: string; steps: number } | undefined;
    if (last) {
      const { error } = await supabase.from('step_logs').delete().eq('id', last.id);
      if (error) throw error;
      const cur = await cachedDay(date);
      return mutateDay(date, { steps: Math.max(0, cur.steps - (last.steps ?? 0)), lastStep: undefined });
    }
  }
  // Offline: we still know how big the newest log was.
  const cur = await cachedDay(date);
  if (cur.steps <= 0) return cur;
  return mutateDay(date, { steps: Math.max(0, cur.steps - (cur.lastStep ?? cur.steps)), lastStep: undefined });
}

/** Server totals for the last `days` days (newest last). Empty when offline. */
export async function fetchStepHistory(days = 14): Promise<Record<string, number>> {
  const userId = await currentUserId();
  if (!userId) return {};
  const from = dayKeyOffset(-(days - 1));
  const { data, error } = await supabase
    .from('step_logs')
    .select('log_date, steps')
    .eq('user_id', userId)
    .gte('log_date', from);
  if (error) return {};
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as { log_date: string; steps: number }[]) {
    out[r.log_date] = (out[r.log_date] ?? 0) + (r.steps ?? 0);
  }
  return out;
}

/** Replace local cache with server truth for the last `days` days. */
export async function reconcileSteps(days = 14): Promise<Record<string, number>> {
  const totals = await fetchStepHistory(days);
  if (!Object.keys(totals).length) return totals;
  const cache = await readCache();
  for (const [k, v] of Object.entries(totals)) {
    cache.days[k] = { ...(cache.days[k] ?? emptyDay(k)), steps: v };
  }
  await writeCache(cache);
  return totals;
}

/** Re-check milestones after a sync (server already has the steps). */
export async function syncMilestones(steps: number): Promise<StepMilestone[]> {
  const already = await cachedAchievements();
  const fresh = newlyUnlocked(0, steps, already);
  if (!fresh.length) return [];
  await writeCache({ ...(await readCache()), unlocked: [...already, ...fresh.map((m) => m.code)] });
  const userId = await currentUserId();
  if (userId) {
    for (const m of fresh) {
      await supabase
        .from('achievements')
        .upsert({ user_id: userId, code: m.code, log_date: localDayKey() }, { onConflict: 'user_id,code', ignoreDuplicates: true });
    }
  }
  return fresh;
}

// ------------------------------------------------------------------ water --

/** Log a drink. `ml` must be 1–3000 (a jug is the biggest sensible entry). */
export async function addWater(ml: number): Promise<DayActivity> {
  const amount = Math.round(ml);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter at least 1 ml.');
  if (amount > 3000) throw new Error('That is over 3 litres in one go.');

  const date = localDayKey();
  const before = (await cachedDay(date)).waterMl;
  const today = await mutateDay(date, { waterMl: before + amount, lastWaterMl: amount });

  const userId = await currentUserId();
  if (userId) {
    const { error } = await supabase
      .from('water_logs')
      .insert({ user_id: userId, amount_ml: amount, log_date: date });
    if (error) throw error;
  }
  return today;
}

/** Drop the newest water log (server) or subtract the last logged amount. */
export async function undoLastWater(fallbackMl = 250): Promise<DayActivity> {
  const date = localDayKey();
  const userId = await currentUserId();
  if (userId) {
    const { data } = await supabase
      .from('water_logs')
      .select('id, amount_ml')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('logged_at', { ascending: false })
      .limit(1);
    const last = (data ?? [])[0] as { id: string; amount_ml: number } | undefined;
    if (last) {
      const { error } = await supabase.from('water_logs').delete().eq('id', last.id);
      if (error) throw error;
      const cur = await cachedDay(date);
      return mutateDay(date, { waterMl: Math.max(0, cur.waterMl - (last.amount_ml ?? 0)), lastWaterMl: undefined });
    }
  }
  const cur = await cachedDay(date);
  if (cur.waterMl <= 0) return cur;
  return mutateDay(date, { waterMl: Math.max(0, cur.waterMl - (cur.lastWaterMl ?? fallbackMl)), lastWaterMl: undefined });
}

export async function fetchWaterToday(): Promise<number> {
  const userId = await currentUserId();
  if (!userId) return (await cachedDay()).waterMl;
  const date = localDayKey();
  const { data, error } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', userId)
    .eq('log_date', date);
  if (error) return (await cachedDay(date)).waterMl;
  const total = ((data ?? []) as { amount_ml: number }[]).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
  await mutateDay(date, { waterMl: total });
  return total;
}

// ---------------------------------------------------------------- running --

export interface RunEntry {
  id: string | null;
  date: string;
  distanceKm: number;
  durationMin: number;
  calories: number;
}

export async function saveRun(opts: {
  distanceKm: number;
  durationMin: number;
  weightKg?: number;
}): Promise<RunEntry> {
  const stats = runStats(opts.distanceKm, opts.durationMin, opts.weightKg ?? 70);
  const { distanceKm, durationMin } = stats;
  if (distanceKm <= 0 && durationMin <= 0) throw new Error('Add a distance or a time first.');

  const date = localDayKey();
  const cur = await cachedDay(date);
  await mutateDay(date, {
    runKm: Math.round((cur.runKm + distanceKm) * 100) / 100,
    runMin: cur.runMin + durationMin,
    runCalories: cur.runCalories + stats.calories,
  });

  const userId = await currentUserId();
  let id: string | null = null;
  if (userId) {
    const { data, error } = await supabase
      .from('run_logs')
      .insert({
        user_id: userId,
        log_date: date,
        distance_km: distanceKm,
        duration_min: durationMin,
        calories: stats.calories,
      })
      .select('id')
      .single();
    if (error) throw error;
    id = (data as { id: string } | null)?.id ?? null;
  }
  return { id, date, distanceKm, durationMin, calories: stats.calories };
}

export async function deleteRun(entry: RunEntry): Promise<DayActivity> {
  const date = localDayKey();
  if (entry.id) {
    const userId = await currentUserId();
    if (userId) {
      const { error } = await supabase.from('run_logs').delete().eq('id', entry.id);
      if (error) throw error;
    }
  }
  const cur = await cachedDay(date);
  return mutateDay(date, {
    runKm: Math.max(0, Math.round((cur.runKm - entry.distanceKm) * 100) / 100),
    runMin: Math.max(0, cur.runMin - entry.durationMin),
    runCalories: Math.max(0, cur.runCalories - entry.calories),
  });
}

export async function fetchRunsForRange(days = 7): Promise<RunEntry[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const from = dayKeyOffset(-(days - 1));
  const { data, error } = await supabase
    .from('run_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', from)
    .order('started_at', { ascending: false });
  if (error) return [];
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id as string,
    date: r.log_date as string,
    distanceKm: Number(r.distance_km ?? 0),
    durationMin: Number(r.duration_min ?? 0),
    calories: Number(r.calories ?? 0),
  }));
}

// ----------------------------------------------------------- achievements --

export async function fetchUnlockedAchievements(): Promise<string[]> {
  const userId = await currentUserId();
  if (!userId) return cachedAchievements();
  const { data, error } = await supabase
    .from('achievements')
    .select('code')
    .eq('user_id', userId);
  if (error) return cachedAchievements();
  const codes = ((data ?? []) as { code: string }[]).map((r) => r.code);
  const cache = await readCache();
  cache.unlocked = [...new Set([...cache.unlocked, ...codes])];
  await writeCache(cache);
  return cache.unlocked;
}

/** How many of the seven badges are open. */
export function achievementCountReached(steps: number): number {
  return milestonesReached(steps).length;
}

export const TOTAL_ACHIEVEMENTS = STEP_MILESTONES.length;