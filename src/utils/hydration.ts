export function waterTargetMl(weightKg: number | null, active = false, hotClimate = false): number {
  const base = (weightKg ?? 70) * 35;
  let extra = 0;
  if (active) extra += 500;
  if (hotClimate) extra += 500;
  return Math.round(base + extra);
}

export function hydrationMessage(consumedMl: number, targetMl: number): string {
  if (targetMl <= 0) return 'Log water through the day.';
  const pct = consumedMl / targetMl;
  if (pct <= 0.01) return 'Start with a glass of water when you wake up.';
  if (pct < 0.5) return 'Steady pace — sip through the morning.';
  if (pct < 1) return 'Nice — you are close to your daily estimate.';
  if (pct < 1.3) return 'Target reached. Drink to thirst from here.';
  return 'You are well above your estimate — drink to thirst, no need to force more.';
}

export const HYDRATION_EDUCATION =
  'Pale-yellow urine is a rough everyday indicator of adequate hydration. ' +
  'Constantly clear urine plus constant drinking can indicate overhydration. ' +
  'Medical fluid restrictions always override app estimates.';
