export const kg = (v: number | null) => (v == null ? '—' : `${v} kg`);
export const cm = (v: number | null) => (v == null ? '—' : `${v} cm`);
export const pct = (a: number, b: number) =>
  b <= 0 ? 0 : Math.min(1, Math.max(0, a / b));
export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
