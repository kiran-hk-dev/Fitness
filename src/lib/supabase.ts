import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Misconfiguration used to surface as the useless "Network request failed",
 * because the client was pointed at a placeholder host that cannot resolve.
 * Fail fast instead: every caller already try/catches, so they can show the
 * real reason to the user.
 */
export const SUPABASE_MISCONFIGURED = !url || !anon;
export const SUPABASE_CONFIG_HINT =
  'Supabase is not configured. Copy .env.example to .env and fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart with "npx expo start -c".';

if (SUPABASE_MISCONFIGURED) {
  console.warn(`[supabase] ${SUPABASE_CONFIG_HINT}`);
}

// A syntactically valid URL keeps createClient happy while `from()` and
// `auth.*` calls fail with the hint above instead of a DNS error.
const SAFE_URL = url || 'http://localhost:54321';

// Web SSR / static prerender runs in Node where `window` does not exist.
// AsyncStorage's web backend touches bare `window` and crashes the web
// export (GoTrueClient -> storage.getItem during _initialize). This adapter
// is safe everywhere: localStorage in browsers, silent no-op in Node.
const safeWebStorage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return Promise.resolve(null);
      return Promise.resolve(window.localStorage.getItem(key));
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, value);
    } catch {}
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(key);
    } catch {}
    return Promise.resolve();
  },
};

// Persist the auth session on-device, otherwise the user looks
// "signed out" after every reload and all saves fail with "Not signed in".
export const supabase = createClient(SAFE_URL, anon || 'missing-anon-key', {
  auth: {
    storage: Platform.OS === 'web' ? safeWebStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web needs URL session detection for magic-link/OAuth callbacks;
    // native keeps it off to avoid deep-link interference.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
