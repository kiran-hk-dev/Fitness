import {
  STEP_MILESTONES,
  DEFAULT_STEP_TARGET,
  milestoneFor,
  milestonesReached,
  newlyUnlocked,
  nextMilestone,
  tierProgress,
  stepsToNext,
  goalProgress,
  stepsMessage,
  runStats,
  runCalories,
  formatPace,
  formatDuration,
  waterProgress,
  bottleLevel,
} from '../src/utils/steps';

describe('step milestone ladder', () => {
  it('has strictly increasing thresholds', () => {
    for (let i = 1; i < STEP_MILESTONES.length; i++) {
      expect(STEP_MILESTONES[i].steps).toBeGreaterThan(STEP_MILESTONES[i - 1].steps);
    }
  });

  it('marks 10k as the victory node and nothing else', () => {
    expect(STEP_MILESTONES.filter((m) => m.victory).map((m) => m.code)).toEqual(['steps_10k']);
  });

  it('looks a milestone up by code', () => {
    expect(milestoneFor('steps_1k')?.steps).toBe(1000);
    expect(milestoneFor('nope')).toBeUndefined();
  });

  it('reaches nothing at 0 and everything at the top', () => {
    expect(milestonesReached(0)).toHaveLength(0);
    expect(milestonesReached(-50)).toHaveLength(0);
    expect(milestonesReached(20_000)).toHaveLength(STEP_MILESTONES.length);
  });

  it('is inclusive on the exact threshold (1k counts as reached)', () => {
    expect(milestonesReached(999).map((m) => m.code)).toEqual([]);
    expect(milestonesReached(1000).map((m) => m.code)).toEqual(['steps_1k']);
    expect(milestonesReached(9999)).toHaveLength(4);
    expect(milestonesReached(10_000).map((m) => m.code)).toContain('steps_10k');
  });
});

describe('newlyUnlocked', () => {
  it('celebrates the 1k badge the moment it is crossed', () => {
    const got = newlyUnlocked(900, 1000);
    expect(got.map((m) => m.code)).toEqual(['steps_1k']);
  });

  it('celebrates several badges when one big log jumps past them', () => {
    expect(newlyUnlocked(0, 5200).map((m) => m.code)).toEqual(['steps_1k', 'steps_2k5', 'steps_5k']);
  });

  it('fires 10k VICTORY on the crossing step, not before', () => {
    expect(newlyUnlocked(9999, 10_000).map((m) => m.code)).toEqual(['steps_10k']);
    expect(newlyUnlocked(9999, 10_000)[0].victory).toBe(true);
    expect(newlyUnlocked(0, 9999).some((m) => m.victory)).toBe(false);
  });

  it('never repeats a badge that is already banked', () => {
    expect(newlyUnlocked(0, 1000, ['steps_1k'])).toEqual([]);
  });

  it('does nothing when the total did not change', () => {
    expect(newlyUnlocked(5000, 5000)).toEqual([]);
  });
});

describe('progress maths', () => {
  it('points at the next milestone', () => {
    expect(nextMilestone(0)?.code).toBe('steps_1k');
    expect(nextMilestone(1000)?.code).toBe('steps_2k5');
    expect(nextMilestone(20_000)).toBeNull();
  });

  it('counts the steps still needed', () => {
    expect(stepsToNext(0)).toBe(1000);
    expect(stepsToNext(750)).toBe(250);
    expect(stepsToNext(20_000)).toBe(0);
  });

  it('reports tier progress between 0 and 1', () => {
    expect(tierProgress(0)).toBe(0);
    expect(tierProgress(500)).toBeCloseTo(0.5, 5); // halfway to the 1k badge
    expect(tierProgress(1000)).toBe(0); // tier just reset for the next badge
    expect(tierProgress(20_000)).toBe(1);
  });

  it('clamps daily goal progress', () => {
    expect(goalProgress(0, DEFAULT_STEP_TARGET)).toBe(0);
    expect(goalProgress(5000, DEFAULT_STEP_TARGET)).toBe(0.5);
    expect(goalProgress(25_000, DEFAULT_STEP_TARGET)).toBe(1);
    expect(goalProgress(100, 0)).toBe(0);
  });
});

describe('stepsMessage', () => {
  it('nudges at zero', () => {
    expect(stepsMessage(0)).toMatch(/Add steps/);
  });

  it('names the next badge and the gap', () => {
    expect(stepsMessage(4000)).toBe('1,000 steps to Halfway Hero.');
  });

  it('celebrates the finished map', () => {
    expect(stepsMessage(21_000)).toMatch(/goal smashed/);
  });
});

describe('running stats', () => {
  it('computes pace, speed and calories', () => {
    const r = runStats(5, 30, 70);
    expect(r.paceMinPerKm).toBe(6);
    expect(r.speedKmh).toBe(10);
    expect(r.calories).toBe(runCalories(5, 30, 70));
  });

  it('returns zeros instead of NaN when there is no distance yet', () => {
    const r = runStats(0, 0, 70);
    expect(r.paceMinPerKm).toBe(0);
    expect(r.speedKmh).toBe(0);
    expect(r.calories).toBe(0);
  });

  it('never returns negative values for negative input', () => {
    const r = runStats(-5, -30, -70);
    expect(r.distanceKm).toBe(0);
    expect(r.durationMin).toBe(0);
    expect(r.calories).toBe(0);
  });

  it('scales calories with weight and time', () => {
    expect(runCalories(5, 30, 100)).toBeGreaterThan(runCalories(5, 30, 60));
    expect(runCalories(5, 60, 70)).toBeGreaterThan(runCalories(5, 30, 70));
  });
});

describe('formatters', () => {
  it('formats pace as minutes and seconds', () => {
    expect(formatPace(6)).toBe("6'00\"");
    expect(formatPace(5.7)).toBe("5'42\"");
    expect(formatPace(0)).toBe('—');
  });

  it('formats durations with hours only when needed', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('hydration maths', () => {
  it('clamps water progress and survives a bad target', () => {
    expect(waterProgress(1250, 2500)).toBe(0.5);
    expect(waterProgress(9000, 2500)).toBe(1);
    expect(waterProgress(100, 0)).toBe(0);
  });

  it('fills a bottle', () => {
    expect(bottleLevel(250, 500)).toBe(0.5);
    expect(bottleLevel(900, 500)).toBe(1);
  });
});