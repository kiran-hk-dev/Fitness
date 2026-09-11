import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Muted, CheckCard, ActionCard, BottomSpace, TopSpace} from '../../src/components/ui';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { Colors } from '../../src/theme';

const GOALS = [
  { id: 'fat_loss', label: 'Fat loss', desc: 'Gentle, sustainable deficit' },
  { id: 'maintain', label: 'Maintain', desc: 'Stay steady where you are' },
  { id: 'muscle_gain', label: 'Muscle gain', desc: 'Small surplus + protein' },
  { id: 'general_fitness', label: 'General fitness', desc: 'Move, eat and sleep well' },
];

export default function GoalStep() {
  const router = useRouter();
  const goal = useOnboardingStore((s) => s.goal);
  const set = useOnboardingStore((s) => s.set);
  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: Colors.bg }}>
      <TopSpace />
      <H1>Step 2/6 — Goal 🎯</H1>
      <Muted>Tap to select one.</Muted>
      {GOALS.map((g) => (
        <CheckCard key={g.id} label={g.label} desc={g.desc} selected={goal === g.id} onPress={() => set({ goal: g.id })} />
      ))}
      <ActionCard title="Next: Diet →" desc="Your pick is saved" icon="restaurant-outline" onPress={() => router.push('/(onboarding)/diet' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}
