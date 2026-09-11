export type Phase = 'foundation' | 'build' | 'progress' | 'reassess';

export function phaseForWeek(week: number): Phase {
  if (week <= 4) return 'foundation';
  if (week <= 8) return 'build';
  if (week <= 12) return 'progress';
  return 'reassess';
}

export const PHASE_COPY: Record<Phase, string> = {
  foundation: 'Learn technique, establish routine, stop well before form breaks.',
  build: 'Gradually add reps, sets, resistance or duration when technique stays good.',
  progress: 'Use harder variations or slightly more load/volume. Keep recovery days.',
  reassess: 'Do not auto-jump to advanced. Reassess adherence, pain, recovery, form, performance.',
};

export interface SessionResult {
  completedAllSetsAtTopRange: boolean;
  goodTechnique: boolean;
  manageableEffort: boolean; // RPE <= 8
  consecutiveCount: number; // sessions in a row meeting the above
  recoveryPoor: boolean;
  painReported: boolean;
}

/** Safe next-step rule: 2 good sessions at top of rep range -> small increase. */
export function recommendNextStep(r: SessionResult): 'increase' | 'maintain' | 'reduce' {
  if (r.painReported || r.recoveryPoor) return 'reduce';
  if (r.completedAllSetsAtTopRange && r.goodTechnique && r.manageableEffort && r.consecutiveCount >= 2)
    return 'increase';
  return 'maintain';
}

export const SPOT_REDUCTION_NOTE =
  'Exercises can strengthen a specific muscle, but fat loss occurs across the body according to genetics and overall energy balance.';

export const STOP_SIGNALS = [
  'Sharp pain',
  'Dizziness',
  'Chest pain or pressure',
  'Faintness or nausea that does not settle with rest',
];
