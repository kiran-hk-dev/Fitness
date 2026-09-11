import { create } from 'zustand';

interface AppState {
  onboarded: boolean;
  session: { email: string } | null;
  waterTodayMl: number;
  stepsToday: number;
  sleepH: number;
  streak: number;
  set: (p: Partial<AppState>) => void;
  addWater: (ml: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  onboarded: false,
  session: null,
  waterTodayMl: 0,
  stepsToday: 0,
  sleepH: 0,
  streak: 0,
  set: (p) => set(p),
  addWater: (ml) => set((s) => ({ waterTodayMl: s.waterTodayMl + ml })),
}));
