import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Muted, CheckCard, ActionCard, BottomSpace, TopSpace} from '../../src/components/ui';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { Colors } from '../../src/theme';

const PLACES = [
  { id: 'home', label: 'Home', desc: 'Bodyweight, bands, dumbbells' },
  { id: 'gym', label: 'Gym', desc: 'Machines, cables, full setup' },
  { id: 'both', label: 'Both', desc: 'Mix home + gym freely' },
];

export default function EquipmentStep() {
  const router = useRouter();
  const location = useOnboardingStore((s) => s.location);
  const set = useOnboardingStore((s) => s.set);
  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: Colors.bg }}>
      <TopSpace />
      <H1>Step 4/6 — Where? 🏠</H1>
      <Muted>Tap to select one.</Muted>
      {PLACES.map((p) => (
        <CheckCard key={p.id} label={p.label} desc={p.desc} selected={location === p.id} onPress={() => set({ location: p.id })} />
      ))}
      <ActionCard title="Next: Level →" icon="speedometer-outline" onPress={() => router.push('/(onboarding)/level' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}
