import { useState, useEffect } from 'react';
import { ScrollView, TextInput, StyleSheet, Pressable, Text, Alert, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {Card, H1, Body, Muted, ProgressBar, Chip, BottomSpace, SmallButton, ActionCard, TopSpace} from '../../src/components/ui';
import { SlideButton } from '../../src/components/SlideButton';
import { ExercisePhoto } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { registerCustomImages } from '../../src/data/exerciseMedia';
import { getSupabaseExercises } from '../../src/lib/diet';
import type { Exercise } from '../../src/types/app';
import { LEVEL_PROGRAMS, WORKOUT_PLANS } from '../../src/data/workoutPlans';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { supabase } from '../../src/lib/supabase';
import { logTraining } from '../../src/lib/tracking';
import { Colors } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';

export default function ActiveWorkout() {
  const router = useRouter();
  const { program, plan } = useLocalSearchParams<{ program?: string; plan?: string }>();
  const storedPlanId = useWorkoutStore((s) => s.activePlanId);
  const logSet = useWorkoutStore((s) => s.logSet);
  const finishStore = useWorkoutStore((s) => s.finish);
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  // checkmark state per exercise id ✓
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [custom, setCustom] = useState<Exercise[]>([]);
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
  const ALL = [...EXERCISES, ...custom.filter((c) => !EXERCISES.some((e) => e.id === c.id))];

  // Resolve WHICH 10 exercises this session runs (never the same-for-all bug again)
  const tier = LEVEL_PROGRAMS.find((p) => p.id === program);
  const split = WORKOUT_PLANS.find((p) => p.id === (plan ?? storedPlanId));
  const ids = tier?.exercises ?? split?.exercises ?? EXERCISES.slice(0, 10).map((e) => e.id);
  const ex = ids
    .map((id) => ALL.find((e) => e.id === id))
    .filter((e): e is Exercise => Boolean(e));
  const title = tier ? `${tier.name} Program` : split ? split.name : 'Quick session';

  const toggleCheck = async (id: string, name: string) => {
    const next = !done[id];
    setDone((d) => ({ ...d, [id]: next }));
    if (next) {
      // Store training checkmark in Supabase under this user account
      try {
        await logTraining({ kind: 'workout', itemId: id, itemName: name, durationMin: 10 });
      } catch (e: any) {
        Alert.alert('Offline?', 'Checkmark kept locally. Supabase save failed: ' + (e?.message ?? ''));
      }
    }
  };

  const finish = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('workout_sessions').insert({ user_id: user.id, plan_id: tier ? 'level:' + tier.id : split?.id ?? null, duration_min: 30, effort: 7 });
    }
    finishStore();
    router.push('/workouts/summary' as any);
  };

  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>{title} 💪</H1>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Chip label={`${ex.length} moves`} color={tier?.color ?? Colors.primary} icon="list-outline" />
        <Text style={{ color: Colors.muted, fontSize: 12, marginLeft: 8 }}>{doneCount}/{ex.length} done ✓</Text>
      </View>
      <ProgressBar value={ex.length ? doneCount / ex.length : 0} />
      {ex.map((e, i) => {
        const checked = !!done[e.id];
        return (
          <View key={e.id} style={[useStyles().bigCard, checked && { borderColor: Colors.primary, borderWidth: 2 }]}>
            <ExercisePhoto exerciseId={e.id} muscle={e.muscle_group} height={150} rounded={0} />
            <View style={{ padding: 12 }}>
              <Body>{i + 1}. {e.name}</Body>
              <Muted>{e.reps} × {e.sets} • rest {e.rest_sec}s</Muted>
              <Pressable
                onPress={() => toggleCheck(e.id, e.name)}
                style={[useStyles().checkRow, { backgroundColor: checked ? Colors.primary : Colors.raised }]}
              >
                <Text style={[useStyles().checkText, { color: checked ? Colors.text : Colors.text }]}>
                  {checked ? '✓ Done' : '○ Tap when complete'}
                </Text>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput value={reps} onChangeText={setReps} keyboardType="numeric" style={[useStyles().input, { flex: 1 }]} placeholderTextColor={Colors.muted} placeholder="reps" />
                <TextInput value={weight} onChangeText={setWeight} keyboardType="numeric" style={[useStyles().input, { flex: 1 }]} placeholderTextColor={Colors.muted} placeholder="kg" />
              </View>
              <SmallButton title="Log set ✓" icon="add" onPress={() => logSet({ exerciseId: e.id, setNo: 1, reps: Number(reps), weight: Number(weight), done: true })} />
            </View>
          </View>
        );
      })}
      <ActionCard title="Finish workout" desc={`${doneCount}/${ex.length} done — save + summary`} icon="checkmark-done" onPress={finish} />
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
const useStyles = () => StyleSheet.create({
  bigCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.primary, marginVertical: 7, elevation: 3 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 10, color: Colors.text, marginVertical: 4 },
  checkRow: { borderRadius: 10, paddingVertical: 9, alignItems: 'center', marginVertical: 8 },
  checkText: { fontWeight: '800' },
});
