import { buildTargets, estimateTDEE } from '../src/utils/nutrition';
import { phaseForWeek, recommendNextStep } from '../src/utils/progression';

describe('nutrition engine', () => {
  it('builds sane targets', () => {
    const t = buildTargets({ weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'fat_loss' });
    expect(t.calories).toBeGreaterThanOrEqual(1500);
    expect(t.protein_g).toBeGreaterThan(80);
    expect(t.carbs_g + t.fat_g).toBeGreaterThan(0);
  });
  it('tdee scales with activity', () => {
    const low = estimateTDEE(70, 170, 'sedentary');
    const high = estimateTDEE(70, 170, 'very_active');
    expect(high).toBeGreaterThan(low);
  });
});

describe('progression', () => {
  it('maps weeks to phases', () => {
    expect(phaseForWeek(2)).toBe('foundation');
    expect(phaseForWeek(6)).toBe('build');
    expect(phaseForWeek(10)).toBe('progress');
    expect(phaseForWeek(14)).toBe('reassess');
  });
  it('only increases after 2 good sessions', () => {
    expect(
      recommendNextStep({ completedAllSetsAtTopRange: true, goodTechnique: true, manageableEffort: true, consecutiveCount: 2, recoveryPoor: false, painReported: false })
    ).toBe('increase');
    expect(
      recommendNextStep({ completedAllSetsAtTopRange: true, goodTechnique: true, manageableEffort: true, consecutiveCount: 1, recoveryPoor: false, painReported: false })
    ).toBe('maintain');
    expect(
      recommendNextStep({ completedAllSetsAtTopRange: true, goodTechnique: true, manageableEffort: true, consecutiveCount: 3, recoveryPoor: false, painReported: true })
    ).toBe('reduce');
  });
});
