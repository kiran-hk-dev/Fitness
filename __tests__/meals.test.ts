import {
  QUICK_MEALS, quickMealsFor, resolveQuickMeal, quickMealCalories, quickMealCount,
} from '../src/data/quickMeals';
import {
  MEAL_SLOTS, slotForNow, slotMeta, macrosFor, totalMacros, sumCalories,
  groupBySlot, clampQty, stepQty, rankByFrequency, unloggedFoods, groupByCategory,
  type LoggedEntry,
} from '../src/lib/meals';
import { FOODS } from '../src/data/foods';

jest.mock('../src/lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) }, from: jest.fn() },
}));



const entry = (over: Partial<LoggedEntry> = {}): LoggedEntry => ({
  id: 'e1', slot: 'lunch', foodId: 'rice', name: 'Cooked Rice', qty: 1,
  calories: 195, protein_g: 3.5, carbs_g: 44, fat_g: 0.5, fiber_g: 1,
  logged_at: new Date().toISOString(), ...over,
});

describe('quick meal presets', () => {
  it('every preset points at real foods', () => {
    for (const qm of QUICK_MEALS) {
      for (const it of qm.items) expect(FOODS.some((f) => f.id === it.foodId)).toBe(true);
    }
  });

  it('every preset has a valid slot and at least one item', () => {
    const slots = new Set(MEAL_SLOTS.map((m) => m.id));
    for (const qm of QUICK_MEALS) {
      expect(slots.has(qm.slot)).toBe(true);
      expect(quickMealCount(qm)).toBeGreaterThan(0);
      expect(qm.name.length).toBeGreaterThan(0);
    }
  });

  it('ids are unique', () => {
    const ids = QUICK_MEALS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every slot has at least one preset', () => {
    for (const m of MEAL_SLOTS) expect(quickMealsFor(m.id).length).toBeGreaterThan(0);
  });

  it('shows the real kcal a preset will add', () => {
    const dal = QUICK_MEALS.find((x) => x.id === 'qm-dalrice')!;
    expect(quickMealCalories(dal)).toBe(170 + 195 + 95); // 460
  });

  it('handles half portions in a preset', () => {
    const d = QUICK_MEALS.find((x) => x.id === 'qm-lightdosa')!;
    const items = resolveQuickMeal(d);
    const curd = items.find((i) => i.foodId === 'curd')!;
    expect(curd.qty).toBe(0.5);
    expect(curd.calories).toBe(48);
  });

  it('drops unknown food ids instead of throwing', () => {
    const bad = { ...QUICK_MEALS[0], items: [{ foodId: 'nope-not-real', qty: 1 }] };
    expect(resolveQuickMeal(bad)).toEqual([]);
    expect(quickMealCalories(bad)).toBe(0);
  });
});

describe('slot inference', () => {
  it('maps the clock to a sensible slot', () => {
    expect(slotForNow(new Date(2026, 0, 1, 8))).toBe('breakfast');
    expect(slotForNow(new Date(2026, 0, 1, 13))).toBe('lunch');
    expect(slotForNow(new Date(2026, 0, 1, 18))).toBe('dinner');
    expect(slotForNow(new Date(2026, 0, 1, 23))).toBe('snack');
  });

  it('covers every hour of the day', () => {
    for (let h = 0; h < 24; h++) {
      expect(MEAL_SLOTS.some((s) => s.id === slotForNow(new Date(2026, 0, 1, h)))).toBe(true);
    }
  });

  it('has a label and emoji for every slot', () => {
    for (const s of MEAL_SLOTS) {
      expect(slotMeta(s.id).label.length).toBeGreaterThan(0);
      expect(slotMeta(s.id).emoji.length).toBeGreaterThan(0);
    }
  });
});

describe('macros for one portion', () => {
  const rice = FOODS.find((f) => f.id === 'rice')!;

  it('scales by quantity', () => {
    expect(macrosFor(rice, 1).calories).toBe(195);
    expect(macrosFor(rice, 2).calories).toBe(390);
    expect(macrosFor(rice, 0.5).calories).toBe(98);
  });

  it('treats a non-positive portion as zero rather than NaN', () => {
    const m = macrosFor(rice, 0);
    expect(m.calories).toBe(0);
    expect(Number.isFinite(m.protein_g)).toBe(true);
  });

  it('keeps one decimal on macros', () => {
    expect(macrosFor(rice, 1).protein_g).toBe(3.5);
  });
});

describe('day totals', () => {
  it('sums a day', () => {
    const t = totalMacros([entry(), entry({ id: 'e2', calories: 95, protein_g: 5 })]);
    expect(t.calories).toBe(290);
    expect(t.protein_g).toBe(8.5);
  });

  it('an empty day is all zeroes, not NaN', () => {
    const t = totalMacros([]);
    expect(t).toEqual({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
  });

  it('groups by slot in meal order and drops empty slots', () => {
    const groups = groupBySlot([
      entry({ slot: 'dinner' }),
      entry({ slot: 'breakfast' }),
      entry({ slot: 'breakfast', id: 'e3', calories: 100 }),
    ]);
    expect(groups.map((g) => g.slot)).toEqual(['breakfast', 'dinner']);
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].kcal).toBe(295);
  });

  it('sumCalories ignores the macro fields', () => {
    expect(sumCalories([entry(), entry({ id: 'x', calories: 5 })])).toBe(200);
  });
});

describe('portion stepping', () => {
  it('clamps into a usable range', () => {
    expect(clampQty(0)).toBe(0.25);
    expect(clampQty(-4)).toBe(0.25);
    expect(clampQty(999)).toBe(10);
    expect(clampQty(NaN)).toBe(1);
  });

  it('steps up and down by a half', () => {
    expect(stepQty(1, 1)).toBe(1.5);
    expect(stepQty(1, -1)).toBe(0.5);
  });

  it('will not fall below the floor', () => {
    expect(stepQty(0.25, -1)).toBe(0.25);
  });

  it('will not exceed the ceiling', () => {
    expect(stepQty(10, 1)).toBe(10);
  });
});

describe('picker ranking', () => {
  it('only ranks foods you have logged, most frequent first', () => {
    const ranked = rankByFrequency(FOODS, { banana: 9, rice: 5, nuts: 1 }, 8);
    expect(ranked.map((f) => f.id)).toEqual(['banana', 'rice', 'nuts']);
  });

  it('returns nothing when there is no history yet', () => {
    expect(rankByFrequency(FOODS, {}, 8)).toEqual([]);
  });

  it('respects the limit', () => {
    expect(rankByFrequency(FOODS, { rice: 3, dal: 2, banana: 1 }, 2)).toHaveLength(2);
  });

  it('unloggedFoods is exactly the complement', () => {
    const freq = { rice: 1 };
    const seen = new Set(rankByFrequency(FOODS, freq, FOODS.length).map((f) => f.id));
    const unseen = new Set(unloggedFoods(FOODS, freq).map((f) => f.id));
    expect(seen.size + unseen.size).toBe(FOODS.length);
    for (const id of seen) expect(unseen.has(id)).toBe(false);
  });

  it('groups every food under a category', () => {
    const groups = groupByCategory(FOODS);
    expect(groups.reduce((a, g) => a + g.items.length, 0)).toBe(FOODS.length);
  });
});