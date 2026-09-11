import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type TrainingKind = 'workout' | 'yoga';
export interface TrainingLog {
  id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  kind: TrainingKind;
  item_id: string;
  item_name: string;
  completed: boolean;
  duration_min: number | null;
}

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in — create an account first.');
  return user.id;
}

/** Non-throwing session check (null when signed out). */
export async function getSessionUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// --- Offline queue: weight/height entered while signed out ---------------
const PENDING_KEY = 'fitlife360:pendingProfile';
export interface PendingProfile { weightKg: number | null; heightCm: number | null; displayName?: string }

export async function savePendingProfile(p: PendingProfile) {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(p));
}
export async function loadPendingProfile(): Promise<PendingProfile | null> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return raw ? (JSON.parse(raw) as PendingProfile) : null;
}
export async function clearPendingProfile() {
  await AsyncStorage.removeItem(PENDING_KEY);
}
/** Push stashed values to Supabase now that a session exists. Returns true if synced. */
export async function syncPendingProfile(): Promise<boolean> {
  const pending = await loadPendingProfile();
  if (!pending) return false;
  const user = await getSessionUser();
  if (!user) return false;
  await saveWeightHeight(pending);
  await clearPendingProfile();
  return true;
}

/** ACCOUNT: ensure a profiles row exists (trigger covers it, this is a safe upsert). */
export async function ensureProfile(displayName?: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: displayName ?? null }, { onConflict: 'id' });
  if (error) throw error;
  return userId;
}

/** ACCOUNT + BODY: save weight/height to profiles AND append to body_metrics history. */
export async function saveWeightHeight(opts: {
  weightKg: number | null;
  heightCm: number | null;
  displayName?: string;
}) {
  const userId = await requireUserId();
  const patch: Record<string, any> = {};
  if (opts.weightKg != null) patch.weight_kg = opts.weightKg;
  if (opts.heightCm != null) patch.height_cm = opts.heightCm;
  if (opts.displayName) patch.display_name = opts.displayName;
  if (Object.keys(patch).length) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
    if (error) throw error;
  }
  if (opts.weightKg != null || opts.heightCm != null) {
    const { error } = await supabase.from('body_metrics').insert({
      user_id: userId,
      weight_kg: opts.weightKg,
      height_cm: opts.heightCm,
    });
    if (error) throw error;
  }
}

/** Latest stored weight/height for this account. */
export async function getLatestBody(): Promise<{ weightKg: number | null; heightCm: number | null }> {
  const userId = await requireUserId();
  const { data: profile } = await supabase
    .from('profiles').select('weight_kg,height_cm').eq('id', userId).single();
  if (profile?.weight_kg || profile?.height_cm) {
    return { weightKg: profile.weight_kg ?? null, heightCm: profile.height_cm ?? null };
  }
  const { data: m } = await supabase
    .from('body_metrics').select('weight_kg,height_cm').eq('user_id', userId)
    .order('logged_at', { ascending: false }).limit(1).single();
  return { weightKg: (m as any)?.weight_kg ?? null, heightCm: (m as any)?.height_cm ?? null };
}

/**
 * TRAINING CHECKMARK: log one completed workout exercise or yoga session.
 * Call once per checkmark tap / per finished item. Repeating the same
 * yoga in a day creates multiple rows -> "times done today" = row count.
 */
export async function logTraining(opts: {
  kind: TrainingKind;
  itemId: string;
  itemName: string;
  completed?: boolean;
  durationMin?: number;
  reps?: number;
  weightKg?: number;
}) {
  const userId = await requireUserId();
  const { error } = await supabase.from('training_logs').insert({
    user_id: userId,
    log_date: todayKey(),
    kind: opts.kind,
    item_id: opts.itemId,
    item_name: opts.itemName,
    completed: opts.completed ?? true,
    duration_min: opts.durationMin ?? null,
    reps: opts.reps ?? null,
    weight_kg: opts.weightKg ?? null,
  });
  if (error) throw error;
}

/** All checkmarked logs for a date (default today). */
export async function getLogsForDate(date = todayKey()): Promise<TrainingLog[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('training_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date)
    .eq('completed', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TrainingLog[];
}

export interface DailySummary {
  date: string;
  weightKg: number | null;
  heightCm: number | null;
  workouts: { name: string; times: number }[];
  yogas: { name: string; times: number }[];
  totalDone: number;
}

function countBy(rows: TrainingLog[]): { name: string; times: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.item_name, (map.get(r.item_name) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, times]) => ({ name, times }))
    .sort((a, b) => b.times - a.times);
}

/** Combined "today" card: weight + yoga names x times + workout names x times. */
export async function getDailySummary(date = todayKey()): Promise<DailySummary> {
  const [logs, body] = await Promise.all([getLogsForDate(date), getLatestBody()]);
  return {
    date,
    weightKg: body.weightKg,
    heightCm: body.heightCm,
    workouts: countBy(logs.filter((l) => l.kind === 'workout')),
    yogas: countBy(logs.filter((l) => l.kind === 'yoga')),
    totalDone: logs.length,
  };
}

/** Share text: "My weight + yoga name x N times today". Saved to daily_shares too. */
export function buildShareText(s: DailySummary): string {
  const lines = [`🧘 FitLife 360 — ${s.date}`];
  lines.push(`⚖️ Weight: ${s.weightKg != null ? `${s.weightKg} kg` : '—'}${s.heightCm != null ? ` | Height: ${s.heightCm} cm` : ''}`);
  if (s.yogas.length) {
    lines.push('🧘 Yoga today:');
    for (const y of s.yogas) lines.push(`  • ${y.name} × ${y.times} time${y.times > 1 ? 's' : ''}`);
  } else {
    lines.push('🧘 Yoga today: none yet');
  }
  if (s.workouts.length) {
    lines.push('💪 Training today:');
    for (const w of s.workouts) lines.push(`  ✓ ${w.name} × ${w.times}`);
  }
  lines.push(`✅ Total checkmarks: ${s.totalDone}`);
  return lines.join('\n');
}

/** Persist a share snapshot so history is kept per account. */
export async function saveShareSnapshot(s: DailySummary) {
  const userId = await requireUserId();
  const { error } = await supabase.from('daily_shares').insert({
    user_id: userId,
    share_date: s.date,
    weight_kg: s.weightKg,
    height_cm: s.heightCm,
    summary_json: { workouts: s.workouts, yogas: s.yogas, total: s.totalDone },
    share_text: buildShareText(s),
  });
  if (error) throw error;
}

// ---------- 3-day auto-retention (matches 0005_retention.sql) ----------
export const RETENTION_DAYS = 3;

/** Pure helper (tested): cutoff instants for "older than N days". */
export function retentionCutoffs(days: number, now = new Date()) {
  const tstz = new Date(now.getTime() - days * 86400000).toISOString();
  const date = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  return { tstz, date };
}

/**
 * Delete this account's log rows older than RETENTION_DAYS.
 * Runs silently on app start (fire-and-forget) so old logs vanish even
 * if the pg_cron server job was never enabled. Only touches the
 * signed-in user's own rows (RLS); profiles/plans/foods are never deleted.
 * Returns per-table delete counts (0s when signed out — never throws).
 */
export async function pruneOldLogs(): Promise<Record<string, number>> {
  const zero = { training_logs: 0, meal_logs: 0, workout_sessions: 0, water_logs: 0, habit_logs: 0, body_metrics: 0, daily_shares: 0 };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return zero;
    const { tstz, date } = retentionCutoffs(RETENTION_DAYS);
    const out: Record<string, number> = { ...zero };
    const wipe = async (table: string, col: string, cutoff: string) => {
      const { error, count } = await supabase.from(table).delete({ count: 'exact' })
        .eq('user_id', user.id).lt(col, cutoff);
      if (!error) out[table] = count ?? 0;
    };
    await wipe('training_logs', 'log_date', date);
    await wipe('meal_logs', 'logged_at', tstz);
    await wipe('workout_sessions', 'started_at', tstz);
    await wipe('water_logs', 'logged_at', tstz);
    await wipe('habit_logs', 'logged_at', tstz);
    await wipe('body_metrics', 'logged_at', tstz);
    await wipe('daily_shares', 'created_at', tstz);
    return out;
  } catch {
    return zero;
  }
}
