import { create } from 'zustand';

interface OnboardingState {
  goal: string;
  diet: string;
  location: string;
  level: string;
  set: (p: Partial<OnboardingState>) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  goal: 'general_fitness',
  diet: 'veg',
  location: 'home',
  level: 'easy',
  set: (p) => set(p),
}));
