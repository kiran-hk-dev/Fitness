import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------- Theme engine ----------
// `Colors` is a live binding: every screen reads it at render time, and the
// persisted choice is applied in app/_layout.tsx BEFORE the first screen
// renders. Changing theme = save + reload (see applyThemeAndReload) so that
// module-level StyleSheets are rebuilt with the new palette as well.

export interface ThemePalette {
  bg: string; bgLight: string; bgSoft: string;
  card: string; cardLight: string; raised: string;
  primary: string; primaryDark: string; primarySoft: string; onPrimary: string;
  accent: string; accentSoft: string; energy: string;
  warning: string; warningSoft: string; danger: string; dangerSoft: string;
  text: string; textLight: string; muted: string; mutedDark: string; faint: string;
  border: string; borderLight: string; scrim: string;
}

const ember: ThemePalette = {
  bg: '#0E0E12', bgLight: '#FFFFFF', bgSoft: '#17171D',
  card: '#1A1A22', cardLight: '#FFFFFF', raised: '#232329',
  primary: '#FF7A1A', primaryDark: '#E05E00', primarySoft: '#3A2410', onPrimary: '#FFFFFF',
  accent: '#38BDF8', accentSoft: '#0C4A6E', energy: '#FF7A1A',
  warning: '#F59E0B', warningSoft: '#451A03', danger: '#EF4444', dangerSoft: '#450A0A',
  text: '#FAFAF8', textLight: '#0F172A', muted: '#A7A7B3', mutedDark: '#64748B', faint: '#55555F',
  border: '#2B2B33', borderLight: '#E2E8F0', scrim: 'rgba(10,10,14,0.85)',
};

const volt: ThemePalette = {
  bg: '#0A0C07', bgLight: '#FFFFFF', bgSoft: '#12140C',
  card: '#151809', cardLight: '#FFFFFF', raised: '#1E2210',
  primary: '#D9FF3D', primaryDark: '#B8E02E', primarySoft: '#2A2F14', onPrimary: '#131300',
  accent: '#38BDF8', accentSoft: '#0C4A6E', energy: '#D9FF3D',
  warning: '#F59E0B', warningSoft: '#451A03', danger: '#EF4444', dangerSoft: '#450A0A',
  text: '#FAFAF8', textLight: '#0F172A', muted: '#A7A7B3', mutedDark: '#64748B', faint: '#55555F',
  border: '#262B18', borderLight: '#E2E8F0', scrim: 'rgba(8,10,5,0.85)',
};

const abyss: ThemePalette = {
  bg: '#050B16', bgLight: '#FFFFFF', bgSoft: '#0A1424',
  card: '#0D1828', cardLight: '#FFFFFF', raised: '#14223A',
  primary: '#22D3EE', primaryDark: '#0EA5C4', primarySoft: '#0E2A35', onPrimary: '#062A33',
  accent: '#A78BFA', accentSoft: '#2E1065', energy: '#22D3EE',
  warning: '#F59E0B', warningSoft: '#451A03', danger: '#EF4444', dangerSoft: '#450A0A',
  text: '#F0F6FF', textLight: '#0F172A', muted: '#8CA3C2', mutedDark: '#5B6B87', faint: '#3D4A63',
  border: '#1E2F4D', borderLight: '#E2E8F0', scrim: 'rgba(4,8,16,0.85)',
};

const ivory: ThemePalette = {
  bg: '#F3F4F6', bgLight: '#FFFFFF', bgSoft: '#E9EBEF',
  card: '#FFFFFF', cardLight: '#FFFFFF', raised: '#EDEFF3',
  primary: '#EA580C', primaryDark: '#C2410C', primarySoft: '#FDEBD9', onPrimary: '#FFFFFF',
  accent: '#0284C7', accentSoft: '#E0F2FE', energy: '#EA580C',
  warning: '#B45309', warningSoft: '#FEF3C7', danger: '#DC2626', dangerSoft: '#FEE2E2',
  text: '#14181F', textLight: '#0F172A', muted: '#6B7280', mutedDark: '#9AA1AD', faint: '#C4C9D2',
  border: '#DFE3EA', borderLight: '#E2E8F0', scrim: 'rgba(20,22,28,0.75)',
};

export const THEMES: Record<string, ThemePalette> = { ember, volt, abyss, ivory };

export const THEME_LIST = [
  { id: 'ember', name: 'Ember', desc: 'Charcoal + orange · default', swatch: '#FF7A1A' },
  { id: 'volt', name: 'Volt', desc: 'Black + volt energy', swatch: '#D9FF3D' },
  { id: 'abyss', name: 'Abyss', desc: 'Deep navy + cyan', swatch: '#22D3EE' },
  { id: 'ivory', name: 'Ivory', desc: 'Clean light mode', swatch: '#EA580C' },
];

export const DEFAULT_THEME = 'ember';
const ACTIVE_KEY = 'fitlife-theme';

export let themeName: string = DEFAULT_THEME;
export let Colors: ThemePalette = THEMES[DEFAULT_THEME];

export function applyTheme(name: string) {
  if (THEMES[name]) {
    themeName = name;
    Colors = THEMES[name];
  }
}

/** Read persisted choice (call before first render). Never throws. */
export async function loadStoredTheme(): Promise<string> {
  try {
    const name = await AsyncStorage.getItem(ACTIVE_KEY);
    if (name && THEMES[name]) applyTheme(name);
  } catch {}
  return themeName;
}

export async function currentThemeName(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(ACTIVE_KEY)) ?? themeName;
  } catch {
    return themeName;
  }
}

/** Persist choice (caller reloads the app to rebuild styles — see Profile). */
export async function saveThemeName(name: string) {
  applyTheme(name);
  try {
    await AsyncStorage.setItem(ACTIVE_KEY, name);
  } catch {}
}

import React, { createContext, useCallback, useContext, useState } from 'react';

// Re-render trigger: styles are built per-render (useStyles factories), so
// bumping this version refreshes every color on screen instantly — no reload.
const ThemeCtx = createContext<{ version: number; setTheme: (name: string) => Promise<void> }>({
  version: 0,
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const setTheme = useCallback(async (name: string) => {
    if (!THEMES[name] || name === themeName) return;
    await saveThemeName(name);
    setVersion((v) => v + 1);
  }, []);
  return <ThemeCtx.Provider value={{ version, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  // `colors` is read at call time, so it always reflects the active theme.
  return { colors: Colors, themeName, version: ctx.version, setTheme: ctx.setTheme };
}

// Shared muscle accents (identical in every theme).
export const MuscleColor: Record<string, string> = {
  chest: '#F472B6',
  back: '#38BDF8',
  shoulders: '#FB923C',
  biceps: '#A78BFA',
  triceps: '#FACC15',
  core: '#34D399',
  glutes: '#F87171',
  legs: '#FB7185',
  cardio: '#EF4444',
  mobility: '#2DD4BF',
  full_body: '#FF7A1A',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const Radius = { sm: 10, md: 16, lg: 24, full: 999 };

export const FontSize = { xs: 12, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 };

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
