import { create } from 'zustand';

/**
 * App-wide flags only.
 *
 * Steps / water / running / streaks live in `src/lib/activity.ts` behind the
 * `useActivity` hook (they need the server + local cache), so they are NOT
 * duplicated here. Onboarding rehydration is handled by useOnboardingStore.
 */
interface AppState {
  onboarded: boolean;
  set: (p: Partial<AppState>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  onboarded: false,
  set: (p) => set(p),
}));