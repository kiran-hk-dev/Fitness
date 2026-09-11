import { useState } from 'react';
import { ScrollView, Pressable, Text, StyleSheet, Alert, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {H1, Muted, BottomSpace, ProgressBar, ActionCard, TopSpace} from '../../src/components/ui';
import { SlideButton } from '../../src/components/SlideButton';
import { YogaGallery, PoseSlideshow } from '../../src/components/ExercisePhoto';
import { YOGA_SESSIONS, YOGA_POSES } from '../../src/data/yoga';
import { logTraining } from '../../src/lib/tracking';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors, MuscleColor } from '../../src/theme';

export default function YogaActive() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = YOGA_SESSIONS.find((s) => s.id === id) ?? YOGA_SESSIONS[0];
  const poses = session.poses
    .map((pid) => YOGA_POSES.find((p) => p.id === pid))
    .filter(Boolean);
  const [done, setDone] = useState<Record<string, number>>({});

  const checkPose = async (poseId: string, poseName: string) => {
    setDone((d) => ({ ...d, [poseId]: (d[poseId] ?? 0) + 1 }));
    try {
      // Each checkmark = 1 completion row; repeats in a day => "× N times"
      await logTraining({ kind: 'yoga', itemId: poseId, itemName: poseName, durationMin: 5 });
    } catch (e: any) {
      Alert.alert('Offline?', 'Kept locally. Supabase save failed: ' + (e?.message ?? ''));
    }
  };

  const finishSession = async () => {
    try {
      // Whole-session checkmark uses the session name (for "yoga name + times per day")
      await logTraining({ kind: 'yoga', itemId: session.id, itemName: session.name, durationMin: session.duration_min });
    } catch (e: any) {
      Alert.alert('Offline?', 'Session kept locally. ' + (e?.message ?? ''));
    }
    router.push('/yoga/history' as any);
  };

  const total = Object.values(done).reduce((a, b) => a + b, 0);

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>{session.name} 🧘</H1>
      <Muted>Hold each picture pose, breathe, tap ✓. × counts repeat ({total} total).</Muted>
      <PoseSlideshow poseIds={session.poses} height={150} />
      <ProgressBar value={poses.length ? total / poses.length : 0} color={MuscleColor.mobility} />
      {poses.map((p: any, i: number) => {
        const n = done[p.id] ?? 0;
        return (
          <View key={p.id} style={[useStyles().bigCard, n > 0 && { borderColor: Colors.primary, borderWidth: 2 }]}>
            <YogaGallery poseId={p.id} height={190} />
            <View style={{ padding: 12 }}>
              <Text style={useStyles().stepN}>POSE {i + 1} · {p.duration_sec}s {n > 0 ? `· ✓ × ${n}` : ''}</Text>
              <Text style={useStyles().poseName}>{p.name}</Text>
              <Text style={useStyles().breath}>🫁 {p.breathing}</Text>
              <Text style={useStyles().setup}>{p.setup}</Text>
              <Text style={useStyles().easier}>🟢 Easier: {p.easier}</Text>
              <Pressable
                onPress={() => checkPose(p.id, p.name)}
                style={[useStyles().check, { backgroundColor: n > 0 ? Colors.primary : Colors.raised }]}
              >
                <Text style={[useStyles().checkText, { color: n > 0 ? Colors.text : Colors.text }]}>
                  {n > 0 ? `✓ Done × ${n} — tap for another round` : '○ Hold it, then checkmark ✓'}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
      <ActionCard title="Finish session" desc={`${total} checkmarks — save + history`} icon="checkmark-done" onPress={finishSession} />
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
const useStyles = () => StyleSheet.create({
  bigCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.primary, marginVertical: 7, elevation: 3 },
  stepN: { color: Colors.primary, fontWeight: '800', fontSize: 11 },
  poseName: { color: Colors.text, fontWeight: '800', fontSize: 17, marginTop: 2 },
  breath: { color: Colors.text, fontSize: 13, marginTop: 4 },
  setup: { color: Colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  easier: { color: Colors.muted, fontSize: 12, marginTop: 3 },
  check: { borderRadius: 10, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  checkText: { fontWeight: '800' },
});
