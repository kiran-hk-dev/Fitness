import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView, StyleSheet, Pressable, Text, TextInput, View, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Card, Muted, BottomSpace, TopSpace, PrimaryButton, GhostButton,
  PageHeader, SectionTitle,
} from '../../src/components/ui';
import { AnimatedBar, CountUp } from '../../src/components/ActivityVisuals';
import { ExercisePhoto } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { registerCustomImages } from '../../src/data/exerciseMedia';
import { getSupabaseExercises } from '../../src/lib/diet';
import type { Exercise } from '../../src/types/app';
import { LEVEL_PROGRAMS, WORKOUT_PLANS } from '../../src/data/workoutPlans';
import {
  seedPlan, nextSetNo, isExerciseComplete, exerciseVolume, sessionVolume, sessionSetCount,
  openSession, recordSet, completeExercise, closeSession, effortFromCompletion,
  loadLocalSession, saveLocalSession, clearLocalSession,
  emptySession, type ExerciseProgress, type LocalSession, type SetPlan,
} from '../../src/lib/sets';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';

/**
 * Active workout.
 *
 * One obvious control per exercise: "Complete set". Tapping it logs the set,
 * advances to the next one, animates the pips in, and persists to Supabase.
 * Reps and weight are per-set, so nothing is shared between exercises.
 */
export default function ActiveWorkout() {
  const router = useRouter();
  const { program, plan } = useLocalSearchParams<{ program?: string; plan?: string }>();

  const [custom, setCustom] = useState<Exercise[]>([]);
  const [session, setSession] = useState<LocalSession>(() => emptySession(''));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(Date.now());

  const tier = LEVEL_PROGRAMS.find((p) => p.id === program);
  const split = WORKOUT_PLANS.find((p) => p.id === plan);
  const planKey = tier ? `level:${tier.id}` : split?.id ?? 'quick';
  const title = tier ? `${tier.name} Program` : split ? split.name : 'Quick session';

  useEffect(() => {
    (async () => {
      try {
        const rows = await getSupabaseExercises();
        rows.forEach((r: any) => r.images_json?.length && registerCustomImages(r.id, r.images_json));
        setCustom(rows.map((r: any): Exercise => ({
          id: r.id, name: r.name, muscle_group: r.muscle_group, level: r.level,
          equipment: r.equipment ?? '—', environment: r.environment ?? 'both',
          instructions: r.instructions_json?.length ? r.instructions_json : ['Follow the demo photos step by step'],
          reps: '10-12', sets: 3, rest_sec: 60, breathing: 'Steady breathing', tempo: 'controlled',
          mistakes: [], contraindications: '', regression: 'Easier version', progression: 'Harder version',
          media_url: null, thumbnail_url: null, tags: ['community'],
        })));
      } catch {}
    })();
  }, []);

  const ALL = useMemo(
    () => [...EXERCISES, ...custom.filter((c) => !EXERCISES.some((e) => e.id === c.id))],
    [custom],
  );
  const ids = tier?.exercises ?? split?.exercises ?? EXERCISES.slice(0, 10).map((e) => e.id);
  const ex = useMemo(
    () => ids.map((id) => ALL.find((e) => e.id === id)).filter((e): e is Exercise => Boolean(e)),
    [ids.join(','), ALL],
  );

// The ref is authoritative for reads and is updated synchronously, so two
  // fast taps on "Complete set" never operate on stale state. Keeping the
  // AsyncStorage write outside the state updater avoids a side effect being
  // replayed under StrictMode.
  const sessionRef = useRef<LocalSession>(session);

  // Restore an interrupted session for the SAME plan, else open a fresh one.
  // The ref must be written too — it is the read path for every mutation.
  useEffect(() => {
    let alive = true;
    (async () => {
      const resumed = await loadLocalSession(planKey);
      if (!alive) return;
      if (resumed) {
        sessionRef.current = resumed;
        setSession(resumed);
        startedAt.current = resumed.startedAt;
        toast('Picked up where you stopped');
        return;
      }
      const fresh = emptySession(planKey);
      const id = await openSession(planKey);
      if (!alive) return;
      const next = { ...fresh, id };
      sessionRef.current = next;
      setSession(next);
      startedAt.current = fresh.startedAt;
    })();
    return () => {
      alive = false;
    };
  }, [planKey]);


  const setProgress = useCallback(
    (exerciseId: string, updater: (p: ExerciseProgress) => ExerciseProgress) => {
      const cur = sessionRef.current;
      const prev = cur.exercises[exerciseId] ?? { plan: [], done: [] };
      const next = { ...cur, exercises: { ...cur.exercises, [exerciseId]: updater(prev) } };
      sessionRef.current = next;
      setSession(next);
      saveLocalSession(next);
    },
    [],
  );

  /** Seed the plan the first time an exercise is touched. */
  const ensurePlanned = useCallback(
    (e: Exercise): SetPlan[] => {
      const p = sessionRef.current.exercises[e.id];
      if (p?.plan.length) return p.plan;
      const plan = seedPlan(e.sets, e.reps);
      setProgress(e.id, (prev) => ({ ...prev, plan: prev.plan.length ? prev.plan : plan }));
      return plan;
    },
    [setProgress],
  );

  const completeSet = async (e: Exercise) => {
    if (busy) return;
    const planned = ensurePlanned(e);
    const progress = sessionRef.current.exercises[e.id] ?? { plan: planned, done: [] };
    const no = nextSetNo(progress);
    if (no == null) return toast('All sets done ✓ — move to the next exercise');

    const set = planned.find((x) => x.setNo === no) ?? planned[planned.length - 1];
    const reps = parseInt(String(set.reps).replace(/[^0-9]/g, ''), 10);
    const weight = Number(set.weight);
    const r = Number.isFinite(reps) && reps > 0 ? reps : 10;
    const w = Number.isFinite(weight) && weight > 0 ? weight : 0;

    // Optimistic: show it immediately, sync in the background.
    setProgress(e.id, (p) => ({ ...p, done: [...p.done, { exerciseId: e.id, setNo: no, reps: r, weight: w, at: Date.now() }] }));
    setExpanded(e.id);

    setBusy(true);
    try {
      await recordSet({ sessionId: sessionRef.current.id, exerciseId: e.id, exerciseName: e.name, setNo: no, reps: r, weight: w });
      const left = planned.length - no;
      toast(left > 0 ? `Set ${no} logged ✓ · ${left} to go · rest ${e.rest_sec}s` : `Set ${no} logged ✓ · exercise complete!`);
    } catch (err: any) {
      toast('Saved on device — will sync later', 'error');
    } finally {
      setBusy(false);
    }
  };

  const finishExercise = async (e: Exercise, plannedCount: number) => {
    const p = session.exercises[e.id];
    if (p && p.done.length < plannedCount) {
      return Alert.alert(
        'Finish early?',
        `${e.name}: ${p.done.length} of ${plannedCount} sets logged.`,
        [
          { text: 'Keep going', style: 'cancel' },
          {
            text: 'Finish anyway',
            onPress: async () => {
              setProgress(e.id, (prev) => ({ ...prev, finishedAt: Date.now() }));
              await completeExercise({ exerciseId: e.id, exerciseName: e.name });
              setExpanded(null);
            },
          },
        ],
      );
    }
    setProgress(e.id, (prev) => ({ ...prev, finishedAt: Date.now() }));
    await completeExercise({ exerciseId: e.id, exerciseName: e.name });
    setExpanded(null);
  };

  const finish = async () => {
    const cur = sessionRef.current;
    const ratio = ex.length ? Object.keys(cur.exercises).filter((k) => cur.exercises[k]?.finishedAt).length / ex.length : 0;
    const mins = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    await closeSession({ sessionId: sessionRef.current.id, durationMin: mins, effort: effortFromCompletion(ratio) });
    await clearLocalSession();
    router.push('/workouts/summary' as any);
  };

  const finishedCount = ex.filter((e) => session.exercises[e.id]?.finishedAt).length;
  const volume = sessionVolume(session.exercises);
  const totalSets = sessionSetCount(session.exercises);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <TopSpace />
      <PageHeader title={title} subtitle="Tap Complete set after every set" icon="barbell-outline" />

      {/* Live session summary */}
      <Card accent={Colors.primary}>
        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statVal}><CountUp to={finishedCount} style={{ color: Colors.text, fontWeight: '900', fontSize: 20 }} />/{ex.length}</Text>
            <Text style={s.statLab}>exercises</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statVal}><CountUp to={totalSets} style={{ color: Colors.text, fontWeight: '900', fontSize: 20 }} /></Text>
            <Text style={s.statLab}>sets logged</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statVal}>
              <CountUp to={Math.round(volume)} style={{ color: Colors.text, fontWeight: '900', fontSize: 20 }} />
            </Text>
            <Text style={s.statLab}>kg volume</Text>
          </View>
        </View>
        <AnimatedBar value={ex.length ? finishedCount / ex.length : 0} style={{ marginTop: 12 }} />
      </Card>

      {ex.map((e, i) => (
        <ExerciseRow
          key={e.id}
          e={e}
          index={i}
          progress={session.exercises[e.id]}
          open={expanded === e.id}
          onToggle={() => setExpanded((cur) => (cur === e.id ? null : e.id))}
          onSeed={() => ensurePlanned(e)}
          onEditSet={(setNo, patch) =>
            setProgress(e.id, (p) => ({
              ...p,
              plan: p.plan.map((x) => (x.setNo === setNo ? { ...x, ...patch } : x)),
            }))
          }
          onCompleteSet={() => completeSet(e)}
          onFinish={() => finishExercise(e, session.exercises[e.id]?.plan.length || e.sets)}
        />
      ))}

      <SectionTitle title="Done for today?" icon="flag-outline" />
      <PrimaryButton title={`Finish workout · ${finishedCount}/${ex.length}`} icon="checkmark-done" onPress={finish} />
      <GhostButton title="Discard this session" icon="trash-outline" onPress={async () => { await clearLocalSession(); toast('Session cleared'); router.back(); }} />
      <BottomSpace />
    </ScrollView>
  );
}

// ---------------------------------------------------------------- one move --

function ExerciseRow({
  e,
  index,
  progress,
  open,
  onToggle,
  onSeed,
  onEditSet,
  onCompleteSet,
  onFinish,
}: {
  e: Exercise;
  index: number;
  progress: ExerciseProgress | undefined;
  open: boolean;
  onToggle: () => void;
  onSeed: () => void;
  onEditSet: (setNo: number, patch: { reps?: string; weight?: string }) => void;
  onCompleteSet: () => void;
  onFinish: () => void;
}) {
  const router = useRouter();
  const done = progress?.done ?? [];
  const planned = progress?.plan.length || e.sets;
  const complete = isExerciseComplete(progress, planned) || !!progress?.finishedAt;
const no = nextSetNo(progress);

  return (
    <Card style={[s.row, complete && { borderColor: Colors.primary, borderWidth: 2 }]} accent={complete ? Colors.primary : undefined}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`${e.name}. ${done.length} of ${planned} sets done`}>
        {!open ? <ExercisePhoto exerciseId={e.id} muscle={e.muscle_group} height={130} rounded={0} /> : null}
        <View style={s.rowHead}>
          <View style={[s.num, complete && { backgroundColor: Colors.primary }]}>
            {complete ? (
              <AppIcon name="checkmark" size={15} color={Colors.onPrimary} />
            ) : (
              <Text style={s.numText}>{index + 1}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.rowName}>{e.name}</Text>
            <Muted>{e.reps} × {e.sets} · rest {e.rest_sec}s</Muted>
          </View>
          <AppIcon name={open ? 'chevron-forward' : 'chevron-forward'} size={18} color={Colors.muted} style={open ? { transform: [{ rotate: '90deg' }] } : undefined} />
        </View>
      </Pressable>

      {/* set pips */}
      <View style={s.pips}>
        {Array.from({ length: planned }).map((_, i) => {
          const filled = i < done.length;
          const isNext = i === done.length && !complete;
          return (
            <View
              key={i}
              style={[
                s.pip,
                filled && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                isNext && { borderColor: Colors.primary, borderWidth: 2 },
              ]}
            >
              <Text style={[s.pipText, (filled || isNext) && { color: filled ? Colors.onPrimary : Colors.primary }]}>
                {i + 1}
              </Text>
            </View>
          );
        })}
        <Text style={s.pipCount}>
          {done.length}/{planned} sets
        </Text>
      </View>

      {/* Logged history */}
      {done.length ? (
        <View style={s.logged}>
          {done.map((d) => (
            <Text key={`${d.setNo}-${d.at}`} style={s.loggedRow}>
              ✓ Set {d.setNo} · {d.reps} reps{d.weight > 0 ? ` · ${d.weight} kg` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      {/* The one obvious control */}
      {complete ? (
        <View style={s.completePill}>
          <AppIcon name="checkmark-done-circle" size={20} color={Colors.primary} />
          <Text style={s.completeText}>
            Complete · {exerciseVolume(progress) > 0 ? `${Math.round(exerciseVolume(progress))} kg volume` : 'done'}
          </Text>
        </View>
      ) : (
        <>
          <Pressable
            onPress={() => { if (!open) { onSeed(); onToggle(); } onCompleteSet(); }}
            accessibilityRole="button"
            accessibilityLabel={`Complete set ${no ?? ''} for ${e.name}`}
            style={({ pressed }) => [
              s.completeBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <AppIcon name="checkmark" size={22} color={Colors.onPrimary} />
            <Text style={s.completeBtnText}>Complete set {no ?? ''}</Text>
          </Pressable>
          <Muted style={{ textAlign: 'center', marginTop: 6 }}>
            Rest {e.rest_sec}s before the next set
          </Muted>
        </>
      )}

      {open ? (
        <View style={s.editor}>
          <SectionTitle title="Adjust sets" icon="create-outline" />
          {(progress?.plan ?? []).map((p) => {
            const logged = done.find((d) => d.setNo === p.setNo);
            return (
              <View key={p.setNo} style={s.editRow}>
                <Text style={[s.editLabel, logged && { color: Colors.primary }]}>Set {p.setNo}</Text>
                <TextInput
                  value={p.reps}
                  onChangeText={(t) => onEditSet(p.setNo, { reps: t.replace(/[^0-9]/g, '') })}
                  keyboardType="number-pad"
                  placeholder="reps"
                  placeholderTextColor={Colors.muted}
                  style={[s.editInput, { flex: 1 }]}
                />
                <TextInput
                  value={p.weight}
                  onChangeText={(t) => onEditSet(p.setNo, { weight: t.replace(/[^0-9.]/g, '') })}
                  keyboardType="decimal-pad"
                  placeholder="kg"
                  placeholderTextColor={Colors.muted}
                  style={[s.editInput, { flex: 1 }]}
                />
              </View>
            );
          })}
{!complete ? (
            <GhostButton title="Finish exercise early" icon="flag-outline" onPress={onFinish} />
          ) : null}
          <GhostButton title="How to do it" icon="information-circle" onPress={() => router.push(`/workouts/${e.id}` as any)} />
        </View>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  statRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { color: Colors.text, fontWeight: '900', fontSize: 20 },
  statLab: { color: Colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  row: { paddingHorizontal: 12, paddingTop: 0, paddingBottom: 14 },
  rowHead: { flexDirection: 'row', alignItems: 'center', paddingTop: 12 },
  num: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.raised, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  numText: { color: Colors.text, fontWeight: '900', fontSize: 13 },
  rowName: { color: Colors.text, fontWeight: '900', fontSize: 16 },
  pips: { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  pip: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  pipText: { color: Colors.muted, fontWeight: '800', fontSize: 12 },
  pipCount: { color: Colors.muted, fontSize: 12, fontWeight: '800', marginLeft: 2 },
  logged: { marginTop: 10 },
  loggedRow: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 2 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, marginTop: 14 },
  completeBtnText: { color: Colors.onPrimary, fontWeight: '900', fontSize: 16, marginLeft: 8 },
  completePill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primarySoft, borderRadius: 16, paddingVertical: 14, marginTop: 14 },
  completeText: { color: Colors.primary, fontWeight: '900', fontSize: 15, marginLeft: 8 },
  editor: { marginTop: 14, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
  editRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  editLabel: { color: Colors.muted, fontWeight: '800', fontSize: 13, width: 52 },
  editInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, fontWeight: '700', color: Colors.text, marginLeft: 8 },
});