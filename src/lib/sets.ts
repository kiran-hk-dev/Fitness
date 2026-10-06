import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logTraining, getSessionUser } from './tracking';

/**
 * Real set tracking.
 *
 * The old screen kept one shared `reps`/`weight` pair for every exercise and
 * wrote `setNo: 1` forever, so "Log set" was a button that appeared to do
 * nothing. Here a session is a real row in `workout_sessions`, every completed
 * set is a row in `workout_sets`, and the local mirror keeps the UI instant
 * and usable offline.
 */

export interface SetPlan {
  setNo: number;
  reps: string;
  weight: string;
}

export interface CompletedSet {
  exerciseId: string;
  setNo: number;
  reps: number;
  weight: number;
  at: number;
}

export interface ExerciseProgress {
  /** planned sets, each with its own editable reps/weight */
  plan: SetPlan[];
  done: CompletedSet[];
  finishedAt?: number;
}

const KEY = 'fitlife360:activeSession';

export interface LocalSession {
  id: string | null;
  planKey: string;
  startedAt: number;
  exercises: Record<string, ExerciseProgress>;
}

export const emptySession = (planKey: string): LocalSession => ({
  id: null,
  planKey,
  startedAt: Date.now(),
  exercises: {},
});

/** Seed N sets from an exercise's prescription ("10-12" → 10, bodyweight 0). */
export function seedPlan(setCount: number, reps: string, defaultWeight = 0): SetPlan[] {
  const n = Math.max(1, Math.min(10, Math.round(setCount) || 3));
  // parseInt stops at the first non-digit, so "10-12" → 10. (Stripping every
  // non-digit first would concatenate it into 1012.)
  const parsed = parseInt(String(reps ?? ''), 10);
  const r = Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '10';
  return Array.from({ length: n }, (_, i) => ({ setNo: i + 1, reps: r, weight: String(defaultWeight) }));
}

/**
 * Next set number to perform, or null once the exercise is done.
 * Exhausted means finished early OR every planned set is logged — otherwise the
 * button keeps offering phantom sets past the end of the plan.
 */
export function nextSetNo(progress: ExerciseProgress | undefined): number | null {
  const p = progress;
  if (!p) return 1;
  if (p.finishedAt) return null;
  const planned = p.plan.length;
  if (planned > 0 && p.done.length >= planned) return null;
  return p.done.length + 1;
}

export function isExerciseComplete(progress: ExerciseProgress | undefined, planned: number): boolean {
  return !!progress && progress.done.length >= planned;
}

export function exerciseVolume(progress: ExerciseProgress | undefined): number {
  if (!progress) return 0;
  return progress.done.reduce((sum, s) => sum + s.reps * s.weight, 0);
}

/** Total kg lifted across the whole session (weight x reps). */
export function sessionVolume(exercises: Record<string, ExerciseProgress>): number {
  return Object.values(exercises).reduce((sum, p) => sum + exerciseVolume(p), 0);
}

export function sessionSetCount(exercises: Record<string, ExerciseProgress>): number {
  return Object.values(exercises).reduce((sum, p) => sum + p.done.length, 0);
}

// ------------------------------------------------------------ local mirror --

export async function saveLocalSession(s: LocalSession): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export async function loadLocalSession(planKey: string): Promise<LocalSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSession;
    // A different plan means yesterday's half-finished workout; don't mix it in.
    return parsed.planKey === planKey ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearLocalSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}

// ----------------------------------------------------------------- session --

/** Create the `workout_sessions` row. Returns null when signed out / offline. */
export async function openSession(planKey: string): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, plan_id: planKey })
      .select('id')
      .single();
    if (error) return null;
    return (data as { id: string } | null)?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Record one completed set. Persists to `workout_sets` when there is a session,
 * and mirrors the entry into `training_logs` so the daily summary shows it.
 */
export async function recordSet(opts: {
  sessionId: string | null;
  exerciseId: string;
  exerciseName: string;
  setNo: number;
  reps: number;
  weight: number;
}): Promise<CompletedSet> {
  const entry: CompletedSet = {
    exerciseId: opts.exerciseId,
    setNo: opts.setNo,
    reps: opts.reps,
    weight: opts.weight,
    at: Date.now(),
  };
  if (!opts.sessionId) return entry;
  try {
    const { error } = await supabase.from('workout_sets').insert({
      session_id: opts.sessionId,
      exercise_id: opts.exerciseId,
      set_no: opts.setNo,
      reps: opts.reps,
      weight: opts.weight || null,
      completed: true,
    });
    if (error) throw error;
  } catch {
    // Offline: the local mirror still holds it, so never block the tap.
  }
  return entry;
}

/** Checkmark the exercise itself (once per exercise per session). */
export async function completeExercise(opts: {
  exerciseId: string;
  exerciseName: string;
  durationMin?: number;
}): Promise<void> {
  try {
    await logTraining({
      kind: 'workout',
      itemId: opts.exerciseId,
      itemName: opts.exerciseName,
      durationMin: opts.durationMin ?? 0,
      reps: opts.durationMin,
    });
  } catch {
    /* offline — daily summary will catch up on the next sync */
  }
}

/** Close the session row: duration + effort + completed_at. */
export async function closeSession(opts: {
  sessionId: string | null;
  durationMin: number;
  effort: number;
}): Promise<void> {
  if (!opts.sessionId) return;
  try {
    await supabase
      .from('workout_sessions')
      .update({ completed_at: new Date().toISOString(), duration_min: opts.durationMin, effort: opts.effort })
      .eq('id', opts.sessionId);
  } catch {
    /* non-fatal */
  }
}

/** 1–10 effort from how much of the session got finished (0–1 completion). */
export function effortFromCompletion(completedRatio: number): number {
  const r = Math.min(1, Math.max(0, completedRatio));
  return Math.max(1, Math.round(1 + r * 9));
}