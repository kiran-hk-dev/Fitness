import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getSessionUser } from './tracking';
import type { Food } from '../types/app';

/**
 * Meal logging — instant model.
 *
 * The previous design made you fill a "tray" and then press Save, which is two
 * extra steps every single time. Now a tap writes straight through to today's
 * log: one tap = one logged entry. Portion changes and deletions edit that
 * entry in place.
 *
 * Storage shape is unchanged (meal_logs + meal_log_items), so no migration:
 * each logged item is a meal_logs row with exactly one meal_log_items row.
 */

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_SLOTS: { id: MealSlot; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙' },
  { id: 'snack', label: 'Snack', emoji: '🍎' },
];

/** Longest label — the tab font has to fit this, so it sets the size budget. */
export const LONGEST_SLOT_LABEL = MEAL_SLOTS.reduce(
  (a, b) => (b.label.length > a.length ? b.label : a),
  '',
);

/** The slot that matches the current clock. */
export function slotForNow(d = new Date()): MealSlot {
  const h = d.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export function slotMeta(slot: string): { label: string; emoji: string } {
  return MEAL_SLOTS.find((s) => s.id === slot) ?? { label: slot, emoji: '🍽️' };
}

// ------------------------------------------------------------------ types ---

export interface LoggedEntry {
  /** meal_logs.id */
  id: string;
  slot: MealSlot;
  foodId: string;
  name: string;
  qty: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  logged_at: string;
  /** true while queued offline and not yet on the server */
  pending?: boolean;
}

export interface Macros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Nutrition for one food at one portion. */
export function macrosFor(food: Food, qty: number): Macros {
  const q = qty > 0 ? qty : 0;
  return {
    calories: Math.round(food.calories * q),
    protein_g: round1(food.protein_g * q),
    carbs_g: round1(food.carbs_g * q),
    fat_g: round1(food.fat_g * q),
    fiber_g: round1(food.fiber_g * q),
  };
}

/** Totals for a set of entries. */
export function totalMacros(entries: LoggedEntry[]): Macros {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  for (const e of entries) {
    t.calories += e.calories;
    t.protein_g += e.protein_g;
    t.carbs_g += e.carbs_g;
    t.fat_g += e.fat_g;
    t.fiber_g += e.fiber_g ?? 0;
  }
  return {
    calories: Math.round(t.calories),
    protein_g: round1(t.protein_g),
    carbs_g: round1(t.carbs_g),
    fat_g: round1(t.fat_g),
    fiber_g: round1(t.fiber_g),
  };
}

/** kcal for a group of entries (used for per-slot subtotals). */
export function sumCalories(entries: LoggedEntry[]): number {
  return Math.round(entries.reduce((a, e) => a + e.calories, 0));
}

/** Group today's entries by slot, keeping slot order. */
export function groupBySlot(entries: LoggedEntry[]): { slot: MealSlot; label: string; emoji: string; items: LoggedEntry[]; kcal: number }[] {
  return MEAL_SLOTS.map((m) => {
    const items = entries.filter((e) => e.slot === m.id);
    return { slot: m.id, label: m.label, emoji: m.emoji, items, kcal: sumCalories(items) };
  }).filter((g) => g.items.length > 0);
}

// --------------------------------------------------------------- portioning --

/** Clamp a portion to something sane (¼ … 10). */
export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(10, Math.max(0.25, round1(qty)));
}

/** Step a portion up or down; dropping below ¼ removes the entry. */
export function stepQty(qty: number, dir: 1 | -1): number {
  const step = 0.5;
  return clampQty(qty + step * dir);
}

// ------------------------------------------------------------ frequent foods --

const FREQ_KEY = 'fitlife360:foodFreq';
export type FreqMap = Record<string, number>;

export async function rememberFoods(foodIds: string[]): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FREQ_KEY);
    const map: FreqMap = raw ? JSON.parse(raw) : {};
    for (const id of foodIds) map[id] = (map[id] ?? 0) + 1;
    await AsyncStorage.setItem(FREQ_KEY, JSON.stringify(map));
  } catch {}
}

export async function loadFreq(): Promise<FreqMap> {
  try {
    const raw = await AsyncStorage.getItem(FREQ_KEY);
    return raw ? (JSON.parse(raw) as FreqMap) : {};
  } catch {
    return {};
  }
}

export async function clearFreq(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FREQ_KEY);
  } catch {}
}

/** Most-logged foods first, then unseen foods alphabetically. */
export function rankByFrequency(foods: Food[], freq: FreqMap, limit = 6): Food[] {
  return foods
    .filter((f) => (freq[f.id] ?? 0) > 0)
    .sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0))
    .slice(0, limit);
}

/** Foods never logged yet, in data order. */
export function unloggedFoods(foods: Food[], freq: FreqMap): Food[] {
  return foods.filter((f) => (freq[f.id] ?? 0) === 0);
}

export function groupByCategory(foods: Food[]): { category: string; items: Food[] }[] {
  const map = new Map<string, Food[]>();
  for (const f of foods) {
    const list = map.get(f.category) ?? [];
    list.push(f);
    map.set(f.category, list);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}

export const CATEGORY_EMOJI: Record<string, string> = {
  breakfast: '🌅', grains: '🌾', dal: '🫘', protein: '🍗',
  dairy: '🥛', snack: '🥨', fruit: '🍎', veg: '🥦', other: '🍽️',
};

// --------------------------------------------------------------- server I/O --

/** Ensure every food exists as a foods row (meal_log_items has an FK to it). */
async function ensureFoodRows(foods: Food[]): Promise<void> {
  const { error } = await supabase.from('foods').upsert(
    foods.map((f) => ({
      id: f.id, name: f.name, category: f.category, serving_size: f.serving,
      calories: f.calories, protein_g: f.protein_g, carbs_g: f.carbs_g,
      fat_g: f.fat_g, fiber_g: f.fiber_g, sugar_g: f.sugar_g, published: true,
    })),
    { onConflict: 'id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

/**
 * Log one portion. Returns the stored entry so the UI can render it (and undo
 * it) straight away. Falls back to the local queue when offline or signed out.
 */
export async function logEntry(opts: {
  slot: MealSlot;
  food: Food;
  qty: number;
}): Promise<LoggedEntry> {
  const qty = clampQty(opts.qty);
  const m = macrosFor(opts.food, qty);
  const entry: LoggedEntry = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    slot: opts.slot,
    foodId: opts.food.id,
    name: opts.food.name,
    qty,
    ...m,
    logged_at: new Date().toISOString(),
    pending: true,
  };

  const user = await getSessionUser();
  if (!user) {
    await queue(entry, opts.food);
    return entry;
  }

  try {
    await ensureFoodRows([opts.food]);
    const { data: log, error } = await supabase
      .from('meal_logs')
      .insert({ user_id: user.id, meal_type: opts.slot, total_calories: m.calories })
      .select('id')
      .single();
    if (error || !log) throw error ?? new Error('meal_log insert failed');

    const { error: itemErr } = await supabase.from('meal_log_items').insert({
      meal_log_id: log.id,
      food_id: opts.food.id,
      quantity: qty,
      calculated_nutrition_json: m,
    });
    if (itemErr) throw itemErr;

    await rememberFoods([opts.food.id]);
    return { ...entry, id: log.id, pending: false };
  } catch (e) {
    await queue(entry, opts.food);
    return entry;
  }
}

/** Change the portion of an already-logged entry. */
export async function updateQty(entry: LoggedEntry, qty: number): Promise<LoggedEntry | null> {
  const food = await findFood(entry.foodId);
  if (!food) return null;
  const next = { ...entry, qty: clampQty(qty), pending: true };
  const m = macrosFor(food, next.qty);
  Object.assign(next, m);

  if (!entry.id.startsWith('local_')) {
    const user = await getSessionUser();
    if (user) {
      try {
        await supabase
          .from('meal_logs')
          .update({ total_calories: m.calories })
          .eq('id', entry.id)
          .eq('user_id', user.id);
        await supabase
          .from('meal_log_items')
          .update({ quantity: next.qty, calculated_nutrition_json: m })
          .eq('meal_log_id', entry.id);
        return { ...next, pending: false };
      } catch {
        /* fall through to the local mirror */
      }
    }
  }
  patchLocal(entry.id, next);
  return next;
}

/** Remove one logged entry. */
export async function removeEntry(entry: LoggedEntry): Promise<void> {
  if (!entry.id.startsWith('local_')) {
    const user = await getSessionUser();
    if (user) {
      try {
        // meal_log_items cascades from meal_logs
        await supabase.from('meal_logs').delete().eq('id', entry.id).eq('user_id', user.id);
        return;
      } catch {
        /* fall through */
      }
    }
  }
  const list = await readQueue();
  await writeQueue(list.filter((e) => e.id !== entry.id));
}

// ------------------------------------------------------------ offline queue --

const QUEUE_KEY = 'fitlife360:mealQueue';

async function queue(entry: LoggedEntry, food: Food): Promise<void> {
  const list = await readQueue();
  list.push({ ...entry, foodJson: food } as QueuedEntry);
  await writeQueue(list.slice(-60));
}

export interface QueuedEntry extends LoggedEntry {
  foodJson: Food;
}

async function readQueue(): Promise<QueuedEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(list: QueuedEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  } catch {}
}

function patchLocal(id: string, next: LoggedEntry): void {
  void (async () => {
    const list = await readQueue();
    const i = list.findIndex((e) => e.id === id);
    if (i < 0) return;
    list[i] = { ...list[i], ...next };
    await writeQueue(list);
  })();
}

export async function queuedCount(): Promise<number> {
  return (await readQueue()).length;
}

/** Push queued entries to Supabase. Returns how many synced. */
export async function flushQueue(): Promise<number> {
  const list = await readQueue();
  if (!list.length) return 0;
  const user = await getSessionUser();
  if (!user) return 0;

  let ok = 0;
  const left: QueuedEntry[] = [];
  for (const e of list) {
    try {
      const m = macrosFor(e.foodJson, e.qty);
      await ensureFoodRows([e.foodJson]);
      const { data: log, error } = await supabase
        .from('meal_logs')
        .insert({ user_id: user.id, meal_type: e.slot, total_calories: m.calories })
        .select('id')
        .single();
      if (error || !log) throw error ?? new Error('flush failed');
      const { error: e2 } = await supabase.from('meal_log_items').insert({
        meal_log_id: log.id,
        food_id: e.foodJson.id,
        quantity: e.qty,
        calculated_nutrition_json: m,
      });
      if (e2) throw e2;
      await rememberFoods([e.foodJson.id]);
      ok++;
    } catch {
      left.push(e);
    }
  }
  await writeQueue(left);
  return ok;
}

// ------------------------------------------------------------------ loading --

let foodCache: Food[] = [];

export function primeFoodCache(foods: Food[]): void {
  foodCache = foods;
}

async function findFood(id: string): Promise<Food | undefined> {
  if (foodCache.length) return foodCache.find((f) => f.id === id);
  try {
    const { data } = await supabase.from('foods').select('*').eq('id', id).limit(1);
    return (data ?? [])[0] as Food | undefined;
  } catch {
    return undefined;
  }
}

/** Every logged entry for today, queued ones included. */
export async function loadTodayEntries(foods: Food[]): Promise<LoggedEntry[]> {
  primeFoodCache(foods);
  const queued = await readQueue();
  const queuedToday = queued.filter((e) => isToday(e.logged_at));

  const user = await getSessionUser();
  if (!user) return queuedToday.map(stripFoodJson);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('meal_logs')
    .select('id, meal_type, total_calories, logged_at, meal_log_items(food_id, quantity, calculated_nutrition_json)')
    .eq('user_id', user.id)
    .gte('logged_at', start.toISOString())
    .order('logged_at', { ascending: false });

  const server: LoggedEntry[] = [];
  for (const row of (data ?? []) as any[]) {
    const item = (row.meal_log_items ?? [])[0];
    if (!item) continue;
    const food = foods.find((f) => f.id === item.food_id);
    const m = (item.calculated_nutrition_json ?? {}) as Partial<Macros>;
    server.push({
      id: row.id,
      slot: row.meal_type,
      foodId: item.food_id,
      name: food?.name ?? item.food_id,
      qty: Number(item.quantity ?? 1),
      calories: Number(row.total_calories ?? m.calories ?? 0),
      protein_g: Number(m.protein_g ?? 0),
      carbs_g: Number(m.carbs_g ?? 0),
      fat_g: Number(m.fat_g ?? 0),
      fiber_g: Number(m.fiber_g ?? food?.fiber_g ?? 0),
      logged_at: row.logged_at,
    });
  }
  // de-dup: a queued entry that later synced appears twice
  const serverIds = new Set(server.map((e) => e.id));
  return [...server, ...queuedToday.filter((e) => !serverIds.has(e.id)).map(stripFoodJson)]
    .sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1));
}

function stripFoodJson(e: QueuedEntry): LoggedEntry {
  const { foodJson, ...rest } = e;
  return rest;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}