import AsyncStorage from '@react-native-async-storage/async-storage';

// Locally hidden built-in items (community items delete from Supabase instead).
const EX_KEY = 'fitlife360:hiddenExercises';
const SES_KEY = 'fitlife360:hiddenSessions';

async function readSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export const getHiddenExercises = () => readSet(EX_KEY);
export const getHiddenSessions = () => readSet(SES_KEY);

async function toggle(key: string, id: string, hide: boolean): Promise<Set<string>> {
  const s = await readSet(key);
  if (hide) s.add(id);
  else s.delete(id);
  await AsyncStorage.setItem(key, JSON.stringify([...s]));
  return s;
}

export const hideExercise = (id: string) => toggle(EX_KEY, id, true);
export const unhideExercise = (id: string) => toggle(EX_KEY, id, false);
export const hideSession = (id: string) => toggle(SES_KEY, id, true);
export const unhideSession = (id: string) => toggle(SES_KEY, id, false);

export async function clearHiddenExercises(): Promise<Set<string>> {
  await AsyncStorage.removeItem(EX_KEY);
  return new Set();
}
export async function clearHiddenSessions(): Promise<Set<string>> {
  await AsyncStorage.removeItem(SES_KEY);
  return new Set();
}
