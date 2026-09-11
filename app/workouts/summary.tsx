import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {Card, H1, Body, BottomSpace, ActionCard, TopSpace} from '../../src/components/ui';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { recommendNextStep } from '../../src/utils/progression';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function Summary() {
  const router = useRouter();
  const sets = useWorkoutStore((s) => s.sets);
  const volume = sets.reduce((a, s) => a + s.reps * s.weight, 0);
  const rec = recommendNextStep({ completedAllSetsAtTopRange: true, goodTechnique: true, manageableEffort: true, consecutiveCount: 1, recoveryPoor: false, painReported: false });

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Workout Summary 🎉</H1>
      <Card><Body>Sets logged: {sets.length} • Volume: {volume} kg • Effort RPE ~7</Body></Card>
      <Card><Body>Recovery: hydrate, protein-rich meal, sleep 7-9h. Next: {rec} (increase only after 2 good sessions at top range).</Body></Card>
      <ActionCard title="Back home" desc="Today dashboard" icon="home-outline" onPress={() => router.replace('/(tabs)' as any)} />
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
