import { buildShareText } from '../src/lib/tracking';

jest.mock('../src/lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(),
}));

describe('daily share', () => {
  it('includes weight + yoga name x times', () => {
    const text = buildShareText({
      date: '2026-09-07',
      weightKg: 72.5,
      heightCm: 172,
      workouts: [{ name: 'Push-up', times: 1 }],
      yogas: [
        { name: 'Sun Salutation Flow', times: 2 },
        { name: 'Bridge', times: 1 },
      ],
      totalDone: 4,
    });
    expect(text).toMatch('72.5 kg');
    expect(text).toMatch('Sun Salutation Flow × 2 times');
    expect(text).toMatch('Bridge × 1 time');
    expect(text).toMatch('Push-up × 1');
  });
});
