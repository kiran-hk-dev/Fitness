import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, Alert, View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Card, BottomSpace, TopSpace, PageHeader, SectionTitle, PrimaryButton, GhostButton, Chip,
} from '../../src/components/ui';
import { AnimatedBar } from '../../src/components/ActivityVisuals';
import { YogaGallery, PoseSlideshow } from '../../src/components/ExercisePhoto';
import { YOGA_SESSIONS, YOGA_POSES } from '../../src/data/yoga';
import { logTraining } from '../../src/lib/tracking';
import { toast } from '../../src/components/Toast';
import { Colors, MuscleColor } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';

/**
 * Active yoga flow. Each pose has a hold countdown; "Complete pose" is the
 * single obvious control and it records the repetition.
 */
export default function YogaActive() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = YOGA_SESSIONS.find((s) => s.id === id) ?? YOGA_SESSIONS[0];
  const poses = session.poses.map((pid) => YOGA_POSES.find((p) => p.id === pid)).filter(Boolean) as typeof YOGA_POSES;

  const [done, setDone] = useState<Record<string, number>>({});
  const [activePose, setActivePose] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hold timer for the pose currently being held.
  useEffect(() => {
    if (!activePose) {
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
      return;
    }
    setElapsed(0);
    timer.current = setInterval(() => {
      setElapsed((e) => {
        const pose = poses.find((p) => p.id === activePose);
        if (pose && e + 1 >= pose.duration_sec) {
          if (timer.current) clearInterval(timer.current);
          timer.current = null;
          toast(`${pose.name} — time is up ✓`);
          return pose.duration_sec;
        }
        return e + 1;
      });
    }, 1000);
    return () => {
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
    };
  }, [activePose, poses]);

  const checkPose = async (poseId: string, poseName: string) => {
    setDone((d) => ({ ...d, [poseId]: (d[poseId] ?? 0) + 1 }));
    setActivePose(null);
    try {
      // Each checkmark = 1 completion row; repeats in a day => "× N times"
      await logTraining({ kind: 'yoga', itemId: poseId, itemName: poseName, durationMin: 5 });
    } catch {
      Alert.alert('Offline?', 'Kept locally. Supabase save failed — it will sync later.');
    }
  };

  const finishSession = async () => {
    try {
      await logTraining({
        kind: 'yoga',
        itemId: session.id,
        itemName: session.name,
        durationMin: session.duration_min,
      });
    } catch {
      Alert.alert('Offline?', 'Session kept locally. It will sync later.');
    }
    toast('Session complete 🧘');
    router.push('/yoga/history' as any);
  };

  const total = Object.values(done).reduce((a, b) => a + b, 0);
  const covered = poses.filter((p) => (done[p.id] ?? 0) > 0).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }} contentContainerStyle={{ padding: 16 }}>
      <TopSpace />
      <PageHeader title={session.name} subtitle={session.focus} icon="body-outline" />

      <View style={s.chips}>
        <Chip label={`${session.duration_min} min`} color={MuscleColor.mobility} />
        <Chip label={session.level} color="#38BDF8" />
        <Chip label={`${poses.length} poses`} color="#94A3B8" />
      </View>

      <PoseSlideshow poseIds={session.poses} height={150} />

      <Card accent={MuscleColor.mobility}>
        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statVal}>{covered}/{poses.length}</Text>
            <Text style={s.statLab}>poses held</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statVal}>{total}</Text>
            <Text style={s.statLab}>checkmarks</Text>
          </View>
        </View>
        <AnimatedBar value={poses.length ? covered / poses.length : 0} color={MuscleColor.mobility} style={{ marginTop: 12 }} />
      </Card>

      <SectionTitle title="Hold each pose" icon="timer-outline" right={`${total} total`} />

      {poses.map((p, i) => {
        const n = done[p.id] ?? 0;
        const holding = activePose === p.id;
        const left = Math.max(0, p.duration_sec - elapsed);
        return (
          <Card
            key={p.id}
            style={s.poseCard}
            accent={n > 0 ? Colors.primary : undefined}
          >
            <YogaGallery poseId={p.id} height={170} />
            <View style={s.poseBody}>
              <View style={s.poseHead}>
                <Text style={[s.stepN, n > 0 && { color: Colors.primary }]}>
                  POSE {i + 1} · {p.duration_sec}s{n > 0 ? ` · ✓ × ${n}` : ''}
                </Text>
                {holding ? (
                  <Text style={s.countdown}>{left}s left</Text>
                ) : (
                  <Text style={s.countdownIdle}>{holding ? '' : `${p.duration_sec}s hold`}</Text>
                )}
              </View>
              <Text style={s.poseName}>{p.name}</Text>
              <Text style={s.breath}>🫁 {p.breathing}</Text>
              <Text style={s.setup}>{p.setup}</Text>
              <Text style={s.easier}>🟢 Easier: {p.easier}</Text>

              {/* hold progress */}
              {holding ? (
                <AnimatedBar
                  value={elapsed / p.duration_sec}
                  color={MuscleColor.mobility}
                  height={8}
                  style={{ marginTop: 12 }}
                />
              ) : null}

              <View style={{ flexDirection: 'row', marginTop: 14 }}>
                {!holding ? (
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <PrimaryButton
                      title="Start hold"
                      icon="play-circle"
                      onPress={() => setActivePose(p.id)}
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <GhostButton title="Stop hold" icon="stop-circle-outline" onPress={() => setActivePose(null)} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => checkPose(p.id, p.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${p.name} complete`}
                    style={({ pressed }) => [s.doneBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                  >
                    <AppIcon name="checkmark" size={20} color={Colors.onPrimary} />
                    <Text style={s.doneBtnText}>Complete pose</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Card>
        );
      })}

      <PrimaryButton title="Finish session" icon="checkmark-done" onPress={finishSession} />
      <GhostButton title="Leave" icon="close" onPress={() => router.back()} />
      <BottomSpace />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  statRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { color: Colors.text, fontWeight: '900', fontSize: 20 },
  statLab: { color: Colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  poseCard: { paddingHorizontal: 12, paddingBottom: 14 },
  poseBody: { paddingTop: 12 },
  poseHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepN: { color: MuscleColor.mobility, fontWeight: '900', fontSize: 11, letterSpacing: 0.5, flex: 1, marginRight: 8 },
  countdown: { color: Colors.primary, fontWeight: '900', fontSize: 13 },
  countdownIdle: { color: Colors.muted, fontWeight: '700', fontSize: 11 },
  poseName: { color: Colors.text, fontWeight: '900', fontSize: 17, marginTop: 3 },
  breath: { color: Colors.text, fontSize: 13, marginTop: 5 },
  setup: { color: Colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  easier: { color: Colors.muted, fontSize: 12, marginTop: 3 },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16 },
  doneBtnText: { color: Colors.onPrimary, fontWeight: '900', fontSize: 15, marginLeft: 8 },
});