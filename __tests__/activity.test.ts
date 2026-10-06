import {
  localDayKey,
  dayKeyOffset,
  lastNDays,
  addSteps,
  undoLastSteps,
  addWater,
  undoLastWater,
  readCache,
  writeCache,
  cachedDay,
  syncMilestones,
  reconcileSteps,
  TOTAL_ACHIEVEMENTS,
} from '../src/lib/activity';

jest.mock('../src/lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) }, from: jest.fn() },
}));

const mockStore = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k: string) => (mockStore.has(k) ? mockStore.get(k)! : null)),
  setItem: jest.fn(async (k: string, v: string) => { mockStore.set(k, v); }),
  removeItem: jest.fn(async (k: string) => { mockStore.delete(k); }),
}));

beforeEach(async () => {
  mockStore.clear();
  await writeCache({ days: {}, unlocked: [] });
});

describe('local day keys', () => {
  it('formats as YYYY-MM-DD from local time (not UTC)', () => {
    // 23:30 local on the 7th must stay the 7th even though UTC may already be the 8th.
    const lateNight = new Date(2026, 8, 7, 23, 30);
    expect(localDayKey(lateNight)).toBe('2026-09-07');
  });

  it('pads single-digit months and days', () => {
    expect(localDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('offsets by whole days in both directions', () => {
    const base = new Date(2026, 8, 10);
    expect(dayKeyOffset(-1, base)).toBe('2026-09-09');
    expect(dayKeyOffset(1, base)).toBe('2026-09-11');
    expect(dayKeyOffset(0, base)).toBe('2026-09-10');
  });

  it('builds an oldest-first window ending today', () => {
    const days = lastNDays(3, new Date(2026, 8, 10));
    expect(days).toEqual(['2026-09-08', '2026-09-09', '2026-09-10']);
  });
});

describe('addSteps', () => {
  it('accumulates several logs into one daily total', async () => {
    await addSteps(600);
    await addSteps(400);
    expect((await cachedDay()).steps).toBe(1000);
  });

  it('unlocks the 1k badge exactly once', async () => {
    const first = await addSteps(1000);
    expect(first.unlocked.map((m) => m.code)).toEqual(['steps_1k']);

    const second = await addSteps(100);
    expect(second.unlocked).toEqual([]);
    expect((await cachedDay()).steps).toBe(1100);
  });

  it('celebrates only the TOP badge when one log jumps the ladder', async () => {
    const res = await addSteps(5000);
    // one celebration, not three...
    expect(res.unlocked.map((m) => m.code)).toEqual(['steps_5k']);
    // ...but the ones it skipped are still banked
    const cache = await readCache();
    expect(cache.unlocked).toEqual(
      expect.arrayContaining(['steps_1k', 'steps_2k5', 'steps_5k']),
    );
  });

  it('triggers the 10k VICTORY badge', async () => {
    const res = await addSteps(10_000);
    expect(res.unlocked.map((m) => m.code)).toEqual(['steps_10k']);
    expect(res.unlocked[0].victory).toBe(true);
    expect(res.today.steps).toBe(10_000);
  });

  it('rejects nonsense amounts', async () => {
    await expect(addSteps(0)).rejects.toThrow();
    await expect(addSteps(-100)).rejects.toThrow();
    await expect(addSteps(999_999)).rejects.toThrow();
  });
});

describe('undoLastSteps', () => {
  it('subtracts the newest entry even with no server session', async () => {
    await addSteps(1200);
    await addSteps(800);
    await undoLastSteps();
    expect((await cachedDay()).steps).toBe(1200);
  });

  it('removes the whole day when it was a single entry', async () => {
    await addSteps(300);
    await undoLastSteps();
    expect((await cachedDay()).steps).toBe(0);
  });

  it('never goes below zero', async () => {
    await addSteps(300);
    await undoLastSteps();
    await undoLastSteps();
    expect((await cachedDay()).steps).toBe(0);
  });
});

describe('water', () => {
  it('adds up to the daily total', async () => {
    await addWater(250);
    await addWater(500);
    expect((await cachedDay()).waterMl).toBe(750);
  });

  it('rejects an implausible single entry', async () => {
    await expect(addWater(5000)).rejects.toThrow();
    await expect(addWater(0)).rejects.toThrow();
  });

  it('undo removes exactly the last glass logged', async () => {
    await addWater(250);
    await addWater(500);
    await undoLastWater();
    expect((await cachedDay()).waterMl).toBe(250);
  });

  it('leaves steps alone', async () => {
    await addSteps(1000);
    await addWater(300);
    const day = await cachedDay();
    expect(day.waterMl).toBe(300);
    expect(day.steps).toBe(1000);
  });
});

describe('achievement persistence', () => {
  it('syncMilestones re-detects badges present in the total', async () => {
    const fresh = await syncMilestones(7500);
    expect(fresh.map((m) => m.code)).toEqual(['steps_1k', 'steps_2k5', 'steps_5k', 'steps_7k5']);
  });

  it('syncMilestones is a no-op once they are all banked', async () => {
    await syncMilestones(20_000);
    expect(await syncMilestones(20_000)).toEqual([]);
    expect((await readCache()).unlocked).toHaveLength(TOTAL_ACHIEVEMENTS);
  });
});

describe('offline behaviour', () => {
  it('reconcileSteps leaves the cache alone when there is no session', async () => {
    await addSteps(1000);
    const totals = await reconcileSteps();
    expect(totals).toEqual({});
    expect((await cachedDay()).steps).toBe(1000);
  });

  it('logging works with no signed-in user', async () => {
    await expect(addSteps(250)).resolves.toBeTruthy();
    await expect(addWater(200)).resolves.toBeTruthy();
  });
});