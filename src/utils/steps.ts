/**
 * Pure step / run / water maths. No React, no network — fully unit tested.
 * Everything the achievement map and the rings render comes from here.
 */

export interface StepMilestone {
  steps: number;
  code: string;
  title: string;
  /** Short line under the badge on the map. */
  subtitle: string;
  emoji: string;
  /** true = the headline goal, gets the big victory treatment. */
  victory: boolean;
}

/** Ordered low -> high. `code` is what gets stored in `achievements`. */
export const STEP_MILESTONES: StepMilestone[] = [
  { steps: 1000, code: 'steps_1k', title: 'First Steps', subtitle: '1,000 unlocked', emoji: '👟', victory: false },
  { steps: 2500, code: 'steps_2k5', title: 'Warming Up', subtitle: '2,500 unlocked', emoji: '🔥', victory: false },
  { steps: 5000, code: 'steps_5k', title: 'Halfway Hero', subtitle: '5,000 unlocked', emoji: '⚡', victory: false },
  { steps: 7500, code: 'steps_7k5', title: 'Strong Stride', subtitle: '7,500 unlocked', emoji: '💪', victory: false },
  { steps: 10000, code: 'steps_10k', title: '10K VICTORY', subtitle: 'Goal smashed', emoji: '🏆', victory: true },
  { steps: 15000, code: 'steps_15k', title: 'Trailblazer', subtitle: '15,000 unlocked', emoji: '🚀', victory: false },
  { steps: 20000, code: 'steps_20k', title: 'Legend', subtitle: '20,000 unlocked', emoji: '👑', victory: false },
];

export const DEFAULT_STEP_TARGET = 10000;

export function milestoneFor(code: string): StepMilestone | undefined {
  return STEP_MILESTONES.find((m) => m.code === code);
}

/** Every milestone whose threshold `steps` has reached. */
export function milestonesReached(steps: number): StepMilestone[] {
  if (!Number.isFinite(steps) || steps <= 0) return [];
  return STEP_MILESTONES.filter((m) => steps >= m.steps);
}

/**
 * Milestones crossed by moving from `previous` to `current` and not present
 * in `alreadyUnlocked` — i.e. the ones to celebrate right now.
 */
export function newlyUnlocked(
  previous: number,
  current: number,
  alreadyUnlocked: string[] = [],
): StepMilestone[] {
  const seen = new Set(alreadyUnlocked);
  return STEP_MILESTONES.filter(
    (m) => current >= m.steps && previous < m.steps && !seen.has(m.code),
  );
}

/** The next milestone still ahead, or null once all are done. */
export function nextMilestone(steps: number): StepMilestone | null {
  return STEP_MILESTONES.find((m) => steps < m.steps) ?? null;
}

/**
 * 0–1 progress through the CURRENT tier (between the milestone just passed and
 * the next one). At 10k+ with no next milestone this is 1.
 */
export function tierProgress(steps: number): number {
  const next = nextMilestone(steps);
  if (!next) return 1;
  const prev = [...STEP_MILESTONES].reverse().find((m) => steps >= m.steps)?.steps ?? 0;
  const span = next.steps - prev;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (steps - prev) / span));
}

/** Steps still needed for the next milestone, 0 when everything is unlocked. */
export function stepsToNext(steps: number): number {
  const next = nextMilestone(steps);
  return next ? Math.max(0, next.steps - steps) : 0;
}

/** Progress toward a user's daily goal (clamped 0–1). */
export function goalProgress(steps: number, target = DEFAULT_STEP_TARGET): number {
  if (!target || target <= 0) return 0;
  return Math.min(1, Math.max(0, steps / target));
}

/** One-line nudge for the home card. */
export function stepsMessage(steps: number, target = DEFAULT_STEP_TARGET): string {
  const pct = Math.round(goalProgress(steps, target) * 100);
  if (steps <= 0) return 'Tap “Add steps” to start counting.';
  const toNext = stepsToNext(steps);
  const next = nextMilestone(steps);
  if (next && toNext > 0) return `${toNext.toLocaleString()} steps to ${next.title}.`;
  if (steps >= target) return `Daily goal smashed — ${steps.toLocaleString()} steps!`;
  return `${(target - steps).toLocaleString()} steps to your goal (${pct}%).`;
}

// ---------------------------------------------------------------- running --

export interface RunStats {
  distanceKm: number;
  durationMin: number;
  /** Minutes per kilometre; 0 when there is no distance yet. */
  paceMinPerKm: number;
  /** km per hour. */
  speedKmh: number;
  calories: number;
}

/** MET 8.3 for running ~= 0.0175 kcal per kg per minute. */
const KCAL_PER_KG_MIN = 0.0175;

export function runCalories(distanceKm: number, durationMin: number, weightKg = 70): number {
  const w = weightKg > 0 ? weightKg : 70;
  return Math.round(Math.max(0, durationMin) * w * KCAL_PER_KG_MIN);
}

/** Build the full stats block from raw run inputs. */
export function runStats(distanceKm: number, durationMin: number, weightKg = 70): RunStats {
  const d = Math.max(0, distanceKm);
  const m = Math.max(0, durationMin);
  return {
    distanceKm: Math.round(d * 100) / 100,
    durationMin: Math.round(m),
    paceMinPerKm: d > 0 ? Math.round((m / d) * 100) / 100 : 0,
    speedKmh: m > 0 ? Math.round((d / (m / 60)) * 10) / 10 : 0,
    calories: runCalories(d, m, weightKg),
  };
}

/** "5'42\"" per km, or "—" before there is a distance. */
export function formatPace(paceMinPerKm: number): string {
  if (!paceMinPerKm || paceMinPerKm <= 0) return '—';
  const total = Math.round(paceMinPerKm * 60);
  return `${Math.floor(total / 60)}'${String(total % 60).padStart(2, '0')}"`;
}

export function formatDuration(min: number): string {
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60);
  const mm = total % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
}

// ------------------------------------------------------------------ water --

export const WATER_QUICK_ML = [200, 300, 500] as const;
export const DEFAULT_WATER_TARGET = 2500;

/** 0–1 progress toward the water target (clamped). */
export function waterProgress(consumedMl: number, targetMl: number): number {
  if (!targetMl || targetMl <= 0) return 0;
  return Math.min(1, Math.max(0, consumedMl / targetMl));
}

/** 0–1 how full a bottle of `sizeMl` is. */
export function bottleLevel(consumedMl: number, sizeMl: number): number {
  if (!sizeMl || sizeMl <= 0) return 0;
  return Math.min(1, Math.max(0, consumedMl / sizeMl));
}