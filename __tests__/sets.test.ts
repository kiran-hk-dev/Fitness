import {
  seedPlan,
  nextSetNo,
  isExerciseComplete,
  exerciseVolume,
  sessionVolume,
  sessionSetCount,
  effortFromCompletion,
  emptySession,
  loadLocalSession,
  saveLocalSession,
  clearLocalSession,
  type ExerciseProgress,
} from '../src/lib/sets';

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
});

const prog = (done: number, planned = 3, w = 20, r = 10): ExerciseProgress => ({
  plan: seedPlan(planned, String(r)),
  done: Array.from({ length: done }, (_, i) => ({
    exerciseId: 'e1', setNo: i + 1, reps: r, weight: w, at: i,
  })),
});

describe('seedPlan', () => {
  it('creates the prescribed number of sets with the same starting reps', () => {
    const p = seedPlan(4, '12');
    expect(p).toHaveLength(4);
    expect(p[0]).toEqual({ setNo: 1, reps: '12', weight: '0' });
    expect(p[3].setNo).toBe(4);
  });

  it('parses "10-12" down to the first number', () => {
    expect(seedPlan(3, '10-12')[0].reps).toBe('10');
  });

  it('falls back sensibly for junk prescriptions', () => {
    expect(seedPlan(0, '—')[0].reps).toBe('10');
    expect(seedPlan(3, 'abc')[0].reps).toBe('10');
  });

  it('clamps to a sane 1..10 range', () => {
    expect(seedPlan(-5, '10')).toHaveLength(1);
    expect(seedPlan(99, '10')).toHaveLength(10);
  });

  it('gives each set its own object (not a shared reference)', () => {
    const p = seedPlan(3, '10');
    p[0].reps = '99';
    expect(p[1].reps).toBe('10');
  });
});

describe('nextSetNo', () => {
  it('starts at 1 and advances one set at a time', () => {
    expect(nextSetNo(undefined)).toBe(1);
    expect(nextSetNo(prog(0))).toBe(1);
    expect(nextSetNo(prog(1))).toBe(2);
    expect(nextSetNo(prog(2, 3))).toBe(3);
  });

  it('is null once the exercise is finished', () => {
    expect(nextSetNo(prog(3, 3))).toBeNull();
    expect(nextSetNo({ ...prog(1, 3), finishedAt: Date.now() })).toBeNull();
  });
});

describe('isExerciseComplete', () => {
  it('needs every planned set logged', () => {
    expect(isExerciseComplete(prog(2, 3), 3)).toBe(false);
    expect(isExerciseComplete(prog(3, 3), 3)).toBe(true);
    expect(isExerciseComplete(undefined, 3)).toBe(false);
  });
});

describe('volume maths', () => {
  it('is reps x weight per set, summed', () => {
    expect(exerciseVolume(prog(2, 3, 20, 10))).toBe(400);
  });

  it('is zero when nothing is logged', () => {
    expect(exerciseVolume(undefined)).toBe(0);
    expect(exerciseVolume(prog(0))).toBe(0);
  });

  it('sums across the session', () => {
    const s = emptySession('p1');
    s.exercises = { a: prog(2, 3, 20, 10), b: prog(1, 3, 10, 10) };
    expect(sessionVolume(s.exercises)).toBe(500);
    expect(sessionSetCount(s.exercises)).toBe(3);
  });
});

describe('effortFromCompletion', () => {
  it('maps completion to a 1-10 effort', () => {
    expect(effortFromCompletion(0)).toBe(1);
    expect(effortFromCompletion(1)).toBe(10);
    expect(effortFromCompletion(0.5)).toBe(6);
  });

  it('clamps nonsense input into range', () => {
    expect(effortFromCompletion(-3)).toBe(1);
    expect(effortFromCompletion(9)).toBe(10);
  });
});

describe('local session mirror', () => {
  it('round-trips a session', async () => {
    const s = emptySession('plan-a');
    s.exercises = { x: prog(1, 3) };
    await saveLocalSession(s);
    const back = await loadLocalSession('plan-a');
    expect(back?.exercises.x.done).toHaveLength(1);
  });

  it('does NOT resume a different plan (no mixing sessions)', async () => {
    await saveLocalSession(emptySession('plan-a'));
    expect(await loadLocalSession('plan-b')).toBeNull();
  });

  it('returns null when nothing is stored', async () => {
    expect(await loadLocalSession('plan-a')).toBeNull();
  });

  it('clears', async () => {
    await saveLocalSession(emptySession('plan-a'));
    await clearLocalSession();
    expect(await loadLocalSession('plan-a')).toBeNull();
  });
});