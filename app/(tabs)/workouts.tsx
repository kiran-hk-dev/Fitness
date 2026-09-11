import { ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {Card, H1, Body, Muted, ActionCard, BottomSpace, SectionTitle, TopSpace, PageHeader} from '../../src/components/ui';
import { ExerciseGallery } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { WORKOUT_PLANS } from '../../src/data/workoutPlans';
import { phaseForWeek, PHASE_COPY } from '../../src/utils/progression';
import { Colors } from '../../src/theme';

export default function WorkoutsTab() {
  const router = useRouter();
  const week = 3;
  const demo = EXERCISES[(Math.floor(Date.now() / 86400000) + 3) % EXERCISES.length];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <PageHeader title="Workouts" subtitle="Strength · cardio · mobility" icon="barbell-outline" />
      <Pressable onPress={() => router.push(`/workouts/${demo.id}` as any)}>
        <ExerciseGallery exerciseId={demo.id} muscle={demo.muscle_group} heroHeight={170} />
      </Pressable>
      <Muted>▲ Animated demo — tap to open {demo.name}</Muted>
      <Card><Body>Week {week}: {phaseForWeek(week)} — {PHASE_COPY[phaseForWeek(week)]}</Body></Card>
      <SectionTitle title="Programs" icon="trophy-outline" right="3 levels × 10" />
      {WORKOUT_PLANS.slice(0, 3).map((p) => (
        <ActionCard key={p.id} title={p.name} desc={`${p.days} days/week · tap to open`} icon="trophy-outline" accent="#FF7A1A" onPress={() => router.push('/workouts/plans' as any)} />
      ))}
      <ActionCard title="Pick your level" desc="Beginner · Medium · Advanced" icon="chevron-forward" onPress={() => router.push('/workouts/plans' as any)} />
      <ActionCard title="Exercise Library" desc="63 moves with animated photos" icon="images-outline" onPress={() => router.push('/workouts/library' as any)} />
      <ActionCard title="History" desc="Sessions + delete" icon="time-outline" onPress={() => router.push('/workouts/history' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}
