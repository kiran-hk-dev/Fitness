import { retentionCutoffs, RETENTION_DAYS } from '../src/lib/tracking';

jest.mock('../src/lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));

describe('3-day retention', () => {
  it('defaults to 3 days', () => {
    expect(RETENTION_DAYS).toBe(3);
  });
  it('cutoff is exactly N days back', () => {
    const now = new Date('2026-09-10T12:00:00Z');
    const c = retentionCutoffs(3, now);
    expect(c.tstz).toBe('2026-09-07T12:00:00.000Z');
    expect(c.date).toBe('2026-09-07');
  });
});
