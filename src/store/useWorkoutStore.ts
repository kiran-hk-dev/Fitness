import { create } from 'zustand';

export interface LoggedSet { exerciseId: string; setNo: number; reps: number; weight: number; done: boolean }
interface WorkoutState {
  activePlanId: string | null;
  sets: LoggedSet[];
  startTime: number | null;
  start: (planId: string) => void;
  logSet: (s: LoggedSet) => void;
  finish: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activePlanId: null,
  sets: [],
  startTime: null,
  start: (planId) => set({ activePlanId: planId, sets: [], startTime: Date.now() }),
  logSet: (s) => set((st) => ({ sets: [...st.sets, s] })),
  finish: () => set({ activePlanId: null, sets: [], startTime: null }),
}));
