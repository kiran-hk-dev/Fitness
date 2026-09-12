import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL missing — using placeholder. Copy .env.example to .env');
}

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
export const supabase = createClient(url, anon, {
  auth: {
    storage: Platform.OS === 'web' ? safeWebStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web needs URL session detection for magic-link/OAuth callbacks;
    // native keeps it off to avoid deep-link interference.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
