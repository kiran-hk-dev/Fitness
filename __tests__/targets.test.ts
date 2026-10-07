import {
  getCustomTargets,
  setCustomTargets,
  clearCustomTargets,
  getWaterTarget,
  setWaterTarget,
} from '../src/lib/targets';
import { waterProgress, DEFAULT_WATER_TARGET } from '../src/utils/steps';

jest.mock('../src/lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) }, from: jest.fn() },
}));

const mockStore = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k: string) => (mockStore.has(k) ? mockStore.get(k)! : null)),
  setItem: jest.fn(async (k: string, v: string) => { mockStore.set(k, v); }),
  removeItem: jest.fn(async (k: string) => { mockStore.delete(k); }),
}));

beforeEach(() => mockStore.clear());

describe('water target persistence', () => {
  it('falls back to the default when nothing is saved', async () => {
    expect(await getWaterTarget(DEFAULT_WATER_TARGET)).toBe(DEFAULT_WATER_TARGET);
  });

  it('returns a saved water target instead of the default', async () => {
    await setWaterTarget(3200);
    expect(await getWaterTarget(DEFAULT_WATER_TARGET)).toBe(3200);
  });

  it('survives a reload', async () => {
    await setWaterTarget(1800);
    // simulates remounting the screen
    expect(await getWaterTarget(DEFAULT_WATER_TARGET)).toBe(1800);
  });

  it('does not clobber calories or protein', async () => {
    await setCustomTargets({ calories: 2400, protein_g: 150, water_ml: 2500 });
    await setWaterTarget(3000);
    const t = await getCustomTargets();
    expect(t).toEqual({ calories: 2400, protein_g: 150, water_ml: 3000 });
  });

  it('rounds to whole millilitres', async () => {
    await setWaterTarget(2549.7);
    expect(await getWaterTarget(DEFAULT_WATER_TARGET)).toBe(2550);
  });

  it('works even when no calories target has been set', async () => {
    await setWaterTarget(2000);
    // getCustomTargets() is the "all three set" view and returns null without
    // calories — the water target must still be readable on its own.
    expect(await getWaterTarget(DEFAULT_WATER_TARGET)).toBe(2000);
  });

  it('clearing resets it back to the default', async () => {
    await setWaterTarget(4000);
    await clearCustomTargets();
    expect(await getWaterTarget(DEFAULT_WATER_TARGET)).toBe(DEFAULT_WATER_TARGET);
  });
});

describe('the ring reacts to the target', () => {
  it('shows the same percentage whichever target is loaded', async () => {
    const consumed = 1250;
    await setWaterTarget(2500);
    const a = waterProgress(consumed, await getWaterTarget(DEFAULT_WATER_TARGET));
    await setWaterTarget(5000);
    const b = waterProgress(consumed, await getWaterTarget(DEFAULT_WATER_TARGET));
    expect(a).toBe(0.5);
    expect(b).toBe(0.25);
  });

  it('changing the target changes the percentage, which was the bug', async () => {
    const consumed = 2000;
    await setWaterTarget(2500);
    const before = waterProgress(consumed, await getWaterTarget(DEFAULT_WATER_TARGET));
    await setWaterTarget(4000);
    const after = waterProgress(consumed, await getWaterTarget(DEFAULT_WATER_TARGET));
    expect(after).not.toBe(before);
    expect(after).toBeLessThan(before); // bigger target = smaller percentage
  });

  it('a 0 or missing stored value never produces NaN', async () => {
    await setCustomTargets({ calories: 2000, protein_g: 100, water_ml: 0 });
    const g = await getWaterTarget(DEFAULT_WATER_TARGET);
    expect(Number.isFinite(waterProgress(500, g))).toBe(true);
    expect(g).toBe(DEFAULT_WATER_TARGET);
  });
});