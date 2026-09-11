import type { ActivityLevel, GoalType, NutritionTargets } from '../types/app';

/**
 * Educational estimates only — NOT medical prescriptions.
 * Uses Mifflin-St Jeor with a default anchor (age 30, 70kg, 170cm)
 * when profile data is missing, then adjusts for goal.
 */

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function estimateBMR(weightKg = 70, heightCm = 170, age = 30, sex: string | null = null): number {
  const s = sex === 'female' ? -161 : 5;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + s;
}

export function estimateTDEE(
  weightKg: number | null,
  heightCm: number | null,
  activity: ActivityLevel,
  sex: string | null = null
): number {
  const bmr = estimateBMR(weightKg ?? 70, heightCm ?? 170, 30, sex);
  return Math.round(bmr * ACTIVITY_FACTOR[activity]);
}

export function calorieTargetForGoal(tdee: number, goal: GoalType): number {
  switch (goal) {
    case 'fat_loss':
      // Conservative ~15% deficit, floor at 1500 (flag below)
      return Math.max(1500, Math.round(tdee * 0.85));
    case 'muscle_gain':
      return Math.round(tdee * 1.08);
    case 'maintain':
    case 'general_fitness':
    default:
      return tdee;
  }
}

export function proteinTarget(weightKg: number | null, goal: GoalType, activity: ActivityLevel): number {
  const w = weightKg ?? 70;
  let perKg = 1.2;
  if (goal === 'fat_loss') perKg = 1.8;
  else if (goal === 'muscle_gain') perKg = 1.9;
  else if (goal === 'general_fitness') perKg = 1.4;
  if (activity === 'active' || activity === 'very_active') perKg += 0.2;
  return Math.round(w * perKg);
}

export function buildTargets(opts: {
  weightKg: number | null;
  heightCm: number | null;
  activity: ActivityLevel;
  goal: GoalType;
  sex?: string | null;
}): NutritionTargets {
  const tdee = estimateTDEE(opts.weightKg, opts.heightCm, opts.activity, opts.sex ?? null);
  const calories = calorieTargetForGoal(tdee, opts.goal);
  const protein_g = proteinTarget(opts.weightKg, opts.goal, opts.activity);
  const fat_g = Math.round((calories * 0.27) / 9);
  const carbs_g = Math.max(0, Math.round((calories - protein_g * 4 - fat_g * 9) / 4));
  const fiber_g = Math.round(calories / 100);
  const water_ml = Math.round((opts.weightKg ?? 70) * 35);
  return { calories, protein_g, carbs_g, fat_g, fiber_g, water_ml };
}

export const PLATE_GUIDE =
  'Optional plate guide: 1/2 non-starchy vegetables, 1/4 protein, 1/4 grains/starchy foods.';

export const MEDICAL_FLAG_CONDITIONS = [
  'pregnant',
  'under 18',
  'kidney',
  'liver',
  'diabetes',
  'eating disorder',
  'recent surgery',
  'severe injury',
];
