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
