import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card, Body, Muted, ActionCard, BottomSpace, SectionTitle, TopSpace, PageHeader,
  BigActionButton, ButtonGrid,
} from '../../src/components/ui';
import { ExerciseGallery } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { WORKOUT_PLANS } from '../../src/data/workoutPlans';
import { phaseForWeek, PHASE_COPY } from '../../src/utils/progression';
import { Colors, cell } from '../../src/theme';

/**
 * This tab is STRENGTH only. Yoga, running and mobility each have their own
 * place — the "All training" hub splits them properly instead of mixing them
 * in here.
 */
export default function WorkoutsTab() {
  const router = useRouter();
  const week = 3;
  const demo = EXERCISES[(Math.floor(Date.now() / 86400000) + 3) % EXERCISES.length];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <PageHeader title="Strength" subtitle="Push · pull · legs" icon="barbell-outline" />

      <Pressable onPress={() => router.push(`/workouts/${demo.id}` as any)}>
        <ExerciseGallery exerciseId={demo.id} muscle={demo.muscle_group} heroHeight={170} />
      </Pressable>
      <Muted>▲ Animated demo — tap to open {demo.name}</Muted>

      <Card>
        <Body>Week {week}: {phaseForWeek(week)} — {PHASE_COPY[phaseForWeek(week)]}</Body>
      </Card>

      {/* The other kinds of training, side by side and clearly separated. */}
      <SectionTitle title="Not strength?" icon="git-branch-outline" right="tap to switch" />
      <ButtonGrid>
        <BigActionButton
          style={cell(2)}
          title="Yoga"
          hint="Sessions + pose library"
          icon="body-outline"
          color="#2DD4BF"
          onPress={() => router.push('/yoga' as any)}
        />
        <BigActionButton
          style={cell(2)}
          title="Running"
          hint="Timer, pace, calories"
          icon="run-outline"
          color="#EF4444"
          onPress={() => router.push('/activity/run' as any)}
        />
        <BigActionButton
          style={cell(2)}
          title="Mobility"
          hint="Stretch and recover"
          icon="pulse-outline"
          color={Colors.accent}
          onPress={() => router.push('/nutrition/recovery' as any)}
        />
        <BigActionButton
          style={cell(2)}
          title="All training"
          hint="Every kind, one hub"
          icon="layers-outline"
          onPress={() => router.push('/train' as any)}
        />
      </ButtonGrid>

      <SectionTitle title="Programs" icon="trophy-outline" right={`${WORKOUT_PLANS.length} plans`} />
      {WORKOUT_PLANS.slice(0, 3).map((p) => (
        <ActionCard
          key={p.id}
          title={p.name}
          desc={`${p.days} days/week · tap to open`}
          icon="trophy-outline"
          accent="#FF7A1A"
          onPress={() => router.push('/workouts/plans' as any)}
        />
      ))}

      <SectionTitle title="More" icon="layers-outline" />
      <ActionCard title="Pick your level" desc="Beginner · Medium · Advanced" icon="star-outline" onPress={() => router.push('/workouts/plans' as any)} />
      <ActionCard title="Exercise library" desc={`${EXERCISES.length} moves with animated demos`} icon="images-outline" onPress={() => router.push('/workouts/library' as any)} />
      <ActionCard title="Session history" desc="Past workouts and checkmarks" icon="time-outline" onPress={() => router.push('/workouts/history' as any)} />
      <ActionCard title="Step badges" desc="Your 1k → 10k achievement map" icon="map-outline" accent={Colors.accent} onPress={() => router.push('/activity' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}