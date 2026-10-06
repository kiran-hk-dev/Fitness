import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addSteps as logSteps,
  addWater as logWater,
  undoLastSteps,
  undoLastWater,
  cachedDay,
  reconcileSteps,
  fetchUnlockedAchievements,
  syncMilestones,
  localDayKey,
  type DayActivity,
} from '../lib/activity';
import type { StepMilestone } from '../utils/steps';

const EMPTY: DayActivity = {
  date: '',
  steps: 0,
  waterMl: 0,
  runKm: 0,
  runMin: 0,
  runCalories: 0,
};

export interface UseActivityResult {
  today: DayActivity;
  loading: boolean;
  unlocked: string[];
  /** Milestone to celebrate, set only right after crossing a threshold. */
  celebrating: StepMilestone | null;
  refresh: () => Promise<void>;
  addSteps: (n: number) => Promise<number>;
  undoSteps: () => Promise<void>;
  addWater: (ml: number) => Promise<number>;
  undoWater: () => Promise<void>;
  dismissCelebration: () => void;
}

/**
 * One activity source of truth shared by Home, Steps, Water and Run.
 * Paints from the local cache immediately, then reconciles with the server.
 */
export function useActivity(): UseActivityResult {
  const [today, setToday] = useState<DayActivity>({ ...EMPTY, date: localDayKey() });
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [celebrating, setCelebrating] = useState<StepMilestone | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    // 1) instant local paint
    const local = await cachedDay();
    if (mounted.current) {
      setToday(local);
      setLoading(false);
    }
    // 2) server truth (steps + achievements), then re-check milestones
    try {
      await reconcileSteps();
      const codes = await fetchUnlockedAchievements();
      if (mounted.current) setUnlocked(codes);
      const fresh = await syncMilestones(local.steps);
      if (fresh.length && mounted.current) setCelebrating(fresh[0]);
    } catch {
      /* offline — local cache already painted */
    }
    const again = await cachedDay();
    if (mounted.current) setToday(again);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Reset the day if the app is left open across midnight.
  useEffect(() => {
    const id = setInterval(() => {
      const key = localDayKey();
      setToday((t) => (t.date === key ? t : { ...EMPTY, date: key }));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const addSteps = useCallback(async (n: number) => {
    const res = await logSteps(n);
    if (mounted.current) {
      setToday(res.today);
      if (res.unlocked.length) {
        setUnlocked((u) => [...new Set([...u, ...res.unlocked.map((m) => m.code)])]);
        setCelebrating(res.unlocked[0]);
      }
    }
    return res.today.steps;
  }, []);

  const undoSteps = useCallback(async () => {
    const day = await undoLastSteps();
    if (mounted.current) setToday(day);
  }, []);

  const addWater = useCallback(async (ml: number) => {
    const day = await logWater(ml);
    if (mounted.current) setToday(day);
    return day.waterMl;
  }, []);

  const undoWater = useCallback(async () => {
    const day = await undoLastWater();
    if (mounted.current) setToday(day);
  }, []);

  const dismissCelebration = useCallback(() => setCelebrating(null), []);

  return {
    today,
    loading,
    unlocked,
    celebrating,
    refresh,
    addSteps,
    undoSteps,
    addWater,
    undoWater,
    dismissCelebration,
  };
}