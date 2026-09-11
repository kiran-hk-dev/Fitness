import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Muted, CheckCard, ActionCard, BottomSpace, TopSpace} from '../../src/components/ui';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { Colors } from '../../src/theme';

const LEVELS = [
  { id: 'easy', label: 'Easy', desc: '2–3 days/week · 20–40 min · technique first' },
  { id: 'normal', label: 'Medium', desc: '3–5 days/week · compound lifts + progression' },
  { id: 'advanced', label: 'Advanced', desc: '4–6 days/week · experienced, great recovery' },
];

export default function LevelStep() {
  const router = useRouter();
  const level = useOnboardingStore((s) => s.level);
  const set = useOnboardingStore((s) => s.set);
  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: Colors.bg }}>
      <TopSpace />
      <H1>Step 5/6 — Level ⚡</H1>
      <Muted>Tap to select one. Advanced never unlocks on time alone.</Muted>
      {LEVELS.map((l) => (
        <CheckCard key={l.id} label={l.label} desc={l.desc} selected={level === l.id} onPress={() => set({ level: l.id })} />
      ))}
      <ActionCard title="Next: Schedule →" icon="calendar-outline" onPress={() => router.push('/(onboarding)/schedule' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}
