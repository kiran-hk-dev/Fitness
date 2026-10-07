import AsyncStorage from '@react-native-async-storage/async-storage';

// User-set daily targets (kcal / protein / water). Shown on the Today page.
// Null = use educational estimates from the nutrition engine.
export interface CustomTargets {
  calories: number;
  protein_g: number;
  water_ml: number;
}

const KEY = 'fitlife360:targets';

export async function getCustomTargets(): Promise<CustomTargets | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !(p.calories > 0)) return null;
    return {
      calories: Number(p.calories),
      protein_g: Number(p.protein_g) || 0,
      water_ml: Number(p.water_ml) || 0,
    };
  } catch {
    return null;
  }
}

export async function setCustomTargets(t: CustomTargets) {
  await AsyncStorage.setItem(KEY, JSON.stringify(t));
}

export async function clearCustomTargets() {
  await AsyncStorage.removeItem(KEY);
}

/**
 * Read just the water target, falling back to the caller's default.
 *
 * Deliberately reads the raw record instead of going through
 * `getCustomTargets()`: that helper treats a missing calories value as "no
 * custom targets at all" and returns null, which silently discarded a water
 * target that was saved on its own.
 */
export async function getWaterTarget(fallback: number): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    const ml = Number(p?.water_ml);
    return Number.isFinite(ml) && ml > 0 ? ml : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Update only the water target, preserving calories and protein. Writing the
 * whole object from two screens was how the ring and the water page drifted
 * apart — this makes it impossible to clobber the other fields.
 */
export async function setWaterTarget(waterMl: number): Promise<number> {
  let cur: Partial<CustomTargets> = {};
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) cur = JSON.parse(raw) ?? {};
  } catch {}
  const next = {
    calories: Number(cur.calories) || 0,
    protein_g: Number(cur.protein_g) || 0,
    water_ml: Math.round(waterMl),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next.water_ml;
}
