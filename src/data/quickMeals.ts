import { FOODS } from './foods';

/**
 * One-tap meals.
 *
 * A preset logs several foods in a single press. Because logging is instant
 * (no tray, no Save), a preset simply fires the same `logEntry` call for each
 * of its foods.
 */

export interface QuickMealItem {
  foodId: string;
  /** Portions. 0.5 = half a serving. */
  qty: number;
}

export interface QuickMeal {
  id: string;
  name: string;
  emoji: string;
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: QuickMealItem[];
  accent: string;
}

export const QUICK_MEALS: QuickMeal[] = [
  // breakfast
  { id: 'qm-idli', name: 'Idli + Sambar', emoji: '🥣', slot: 'breakfast', accent: '#FB923C',
    items: [{ foodId: 'idli', qty: 1 }, { foodId: 'sambar', qty: 1 }] },
  { id: 'qm-oats', name: 'Oats + Banana', emoji: '🥣', slot: 'breakfast', accent: '#38BDF8',
    items: [{ foodId: 'oats', qty: 1 }, { foodId: 'banana', qty: 1 }] },
  { id: 'qm-poha', name: 'Poha + Curd', emoji: '🍚', slot: 'breakfast', accent: '#A78BFA',
    items: [{ foodId: 'poha', qty: 1 }, { foodId: 'curd', qty: 1 }] },
  { id: 'qm-eggs', name: 'Eggs + 2 Chapati', emoji: '🍳', slot: 'breakfast', accent: '#FACC15',
    items: [{ foodId: 'egg', qty: 1 }, { foodId: 'chapati', qty: 2 }] },
  { id: 'qm-dosa', name: 'Dosa + Sambar', emoji: '🥞', slot: 'breakfast', accent: '#F97316',
    items: [{ foodId: 'dosa', qty: 1 }, { foodId: 'sambar', qty: 1 }] },

  // lunch
  { id: 'qm-dalrice', name: 'Dal + Rice + Curd', emoji: '🍛', slot: 'lunch', accent: '#34D399',
    items: [{ foodId: 'dal', qty: 1 }, { foodId: 'rice', qty: 1 }, { foodId: 'curd', qty: 1 }] },
  { id: 'qm-rajmarice', name: 'Rajma + Rice', emoji: '🍛', slot: 'lunch', accent: '#22C55E',
    items: [{ foodId: 'rajma', qty: 1 }, { foodId: 'rice', qty: 1 }] },
  { id: 'qm-chapati', name: '3 Chapati + Dal', emoji: '🫓', slot: 'lunch', accent: '#84CC16',
    items: [{ foodId: 'chapati', qty: 3 }, { foodId: 'dal', qty: 1 }] },
  { id: 'qm-chickenrice', name: 'Chicken + Rice', emoji: '🍗', slot: 'lunch', accent: '#EF4444',
    items: [{ foodId: 'chicken', qty: 1 }, { foodId: 'rice', qty: 1 }] },
  { id: 'qm-fishroti', name: 'Fish + 2 Roti', emoji: '🐟', slot: 'lunch', accent: '#38BDF8',
    items: [{ foodId: 'fish', qty: 1 }, { foodId: 'chapati', qty: 2 }] },
  { id: 'qm-paneerroti', name: 'Paneer + 2 Roti', emoji: '🧈', slot: 'lunch', accent: '#FDE68A',
    items: [{ foodId: 'paneer', qty: 1 }, { foodId: 'chapati', qty: 2 }] },

  // dinner
  { id: 'qm-ragidal', name: 'Ragi + Dal', emoji: '🥘', slot: 'dinner', accent: '#2DD4BF',
    items: [{ foodId: 'ragi', qty: 1 }, { foodId: 'dal', qty: 1 }] },
  { id: 'qm-chole', name: 'Chole + 2 Chapati', emoji: '🫘', slot: 'dinner', accent: '#F59E0B',
    items: [{ foodId: 'chole', qty: 1 }, { foodId: 'chapati', qty: 2 }] },
  { id: 'qm-lightdosa', name: 'Dosa + Curd', emoji: '🥞', slot: 'dinner', accent: '#FB7185',
    items: [{ foodId: 'dosa', qty: 1 }, { foodId: 'curd', qty: 0.5 }] },

  // snack
  { id: 'qm-nuts', name: 'Nuts + Buttermilk', emoji: '🥜', slot: 'snack', accent: '#C084FC',
    items: [{ foodId: 'nuts', qty: 1 }, { foodId: 'buttermilk', qty: 1 }] },
  { id: 'qm-sprouts', name: 'Sprouts Chaat', emoji: '🥗', slot: 'snack', accent: '#4ADE80',
    items: [{ foodId: 'sprouts', qty: 1 }] },
  { id: 'qm-bananachana', name: 'Banana + Chana', emoji: '🍌', slot: 'snack', accent: '#FDE047',
    items: [{ foodId: 'banana', qty: 1 }, { foodId: 'chana', qty: 1 }] },
];

export function quickMealsFor(slot: string): QuickMeal[] {
  return QUICK_MEALS.filter((m) => m.slot === slot);
}

/** Resolved items for a preset, dropping unknown food ids. */
export function resolveQuickMeal(meal: QuickMeal) {
  const out: { foodId: string; qty: number; calories: number }[] = [];
  for (const it of meal.items) {
    const f = FOODS.find((x) => x.id === it.foodId);
    if (!f) continue;
    out.push({ foodId: f.id, qty: it.qty, calories: Math.round(f.calories * it.qty) });
  }
  return out;
}

/** kcal a preset will add — shown on the button so nothing is a surprise. */
export function quickMealCalories(meal: QuickMeal): number {
  return resolveQuickMeal(meal).reduce((a, i) => a + i.calories, 0);
}

/** How many foods a preset logs. */
export function quickMealCount(meal: QuickMeal): number {
  return resolveQuickMeal(meal).length;
}