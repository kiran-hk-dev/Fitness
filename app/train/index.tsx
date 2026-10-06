import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PageHeader, Card, Body, Muted, BottomSpace, TopSpace, SectionTitle, SmallButton,
} from '../../src/components/ui';
import { AppIcon, AppIconName } from '../../src/components/AppIcon';
import { ExerciseGallery } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { YOGA_SESSIONS, YOGA_POSES } from '../../src/data/yoga';
import { Colors } from '../../src/theme';

/**
 * Training hub. Four clearly separated buckets so it is obvious what kind of
 * session you are starting — no more guessing between "workouts" and "yoga".
 */

interface Lane {
  id: string;
  title: string;
  blurb: string;
  icon: AppIconName;
  color: string;
  route: string;
  routes: { label: string; icon: AppIconName; to: string }[];
}

const LANES: Lane[] = [
  {
    id: 'strength',
    title: 'Strength & Muscle',
    blurb: 'Push, pull and legs with real sets and reps.',
    icon: 'barbell-outline',
    color: '#FF7A1A',
    route: '/workouts/plans',
    routes: [
      { label: 'Programs', icon: 'trophy-outline', to: '/workouts/plans' },
      { label: 'Exercise library', icon: 'images-outline', to: '/workouts/library' },
      { label: 'Session history', icon: 'time-outline', to: '/workouts/history' },
    ],
  },
  {
    id: 'cardio',
    title: 'Cardio & Running',
    blurb: 'Burn calories, build the engine, log the distance.',
    icon: 'run-outline',
    color: '#EF4444',
    route: '/activity/run',
    routes: [
      { label: 'Log a run', icon: 'timer-outline', to: '/activity/run' },
      { label: 'Steps', icon: 'footsteps-outline', to: '/activity/steps' },
      { label: 'Activity map', icon: 'map-outline', to: '/activity' },
    ],
  },
  {
    id: 'yoga',
    title: 'Yoga',
    blurb: 'Breath-led flows, pose by pose, with hold timers.',
    icon: 'body-outline',
    color: '#2DD4BF',
    route: '/yoga',
    routes: [
      { label: 'Yoga sessions', icon: 'leaf-outline', to: '/yoga' },
      { label: 'Yoga history', icon: 'time-outline', to: '/yoga/history' },
      { label: 'My flows', icon: 'add-circle-outline', to: '/yoga/add' },
    ],
  },
  {
    id: 'mobility',
    title: 'Mobility & Recovery',
    blurb: 'Loosen tight joints and reset between heavy days.',
    icon: 'pulse-outline',
    color: '#38BDF8',
    route: '/nutrition/recovery',
    routes: [
      { label: 'Recovery plan', icon: 'heart-outline', to: '/nutrition/recovery' },
      { label: 'Stretch & mobility', icon: 'repeat-outline', to: '/yoga' },
      { label: 'Habits', icon: 'checkmark-circle-outline', to: '/progress/habits' },
    ],
  },
];

export default function TrainHub() {
  const router = useRouter();
  const demo = EXERCISES[(Math.floor(Date.now() / 86400000) + 3) % EXERCISES.length];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TopSpace height={44} />
        <Pressable style={s.back} onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="chevron-forward" size={20} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <PageHeader title="Train" subtitle="Pick the kind of session" icon="layers-outline" />

        {/* One featured move so the hub is not just a list of links. */}
        <Pressable onPress={() => router.push(`/workouts/${demo.id}` as any)}>
          <ExerciseGallery exerciseId={demo.id} muscle={demo.muscle_group} heroHeight={150} />
        </Pressable>
        <Muted>▲ Today&apos;s demo — tap to open {demo.name}</Muted>

        {LANES.map((lane) => (
          <Card key={lane.id} accent={lane.color} style={{ paddingHorizontal: 14 }}>
            <Pressable style={s.laneHead} onPress={() => router.push(lane.route as any)}>
              <View style={[s.laneIcon, { backgroundColor: lane.color + '22' }]}>
                <AppIcon name={lane.icon} size={22} color={lane.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.laneTitle}>{lane.title}</Text>
                <Muted>{lane.blurb}</Muted>
              </View>
              <AppIcon name="chevron-forward" size={20} color={Colors.muted} />
            </Pressable>

            <View style={s.laneBtns}>
              {lane.routes.map((r) => (
                <SmallButton
                  key={r.label}
                  title={r.label}
                  icon={r.icon}
                  tone="ghost"
                  onPress={() => router.push(r.to as any)}
                />
              ))}
            </View>
          </Card>
        ))}

        <SectionTitle title="At a glance" icon="stats-chart-outline" />
        <Card>
          <Body>
            {EXERCISES.length} exercises · {YOGA_SESSIONS.length} yoga sessions · {YOGA_POSES.length} poses.
          </Body>
          <Muted>Add your own content any time — your additions appear with everyone else&apos;s.</Muted>
          <View style={{ marginTop: 8 }}>
            <SmallButton title="Add an exercise" icon="barbell-outline" tone="ghost" onPress={() => router.push('/workouts/add' as any)} />
            <SmallButton title="Add a yoga flow" icon="body-outline" tone="ghost" onPress={() => router.push('/yoga/add' as any)} />
          </View>
        </Card>
        <BottomSpace />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: { color: Colors.text, fontWeight: '800', fontSize: 15, marginLeft: 2 },
  laneHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  laneIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  laneTitle: { color: Colors.text, fontWeight: '900', fontSize: 17, marginBottom: 1 },
  laneBtns: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
});