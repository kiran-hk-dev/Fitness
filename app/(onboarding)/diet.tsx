import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Muted, Card, Body, CheckCard, ActionCard, BottomSpace, TopSpace} from '../../src/components/ui';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { Colors } from '../../src/theme';

const DIETS = [
  { id: 'veg', label: 'Veg', desc: 'Indian + international veg foods' },
  { id: 'non_veg', label: 'Non-veg', desc: 'Eggs, chicken, fish options' },
  { id: 'eggetarian', label: 'Eggetarian', desc: 'Veg + eggs' },
  { id: 'vegan', label: 'Vegan', desc: 'No animal products' },
];

export default function DietStep() {
  const router = useRouter();
  const diet = useOnboardingStore((s) => s.diet);
  const set = useOnboardingStore((s) => s.set);
  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: Colors.bg }}>
      <TopSpace />
      <H1>Step 3/6 — Diet 🍛</H1>
      <Muted>Tap to select one. Swaps supported for everything.</Muted>
      {DIETS.map((d) => (
        <CheckCard key={d.id} label={d.label} desc={d.desc} selected={diet === d.id} onPress={() => set({ diet: d.id })} />
      ))}
      <Card><Body>Allergies / disliked foods can be edited later in Profile.</Body></Card>
      <ActionCard title="Next: Equipment →" icon="barbell-outline" onPress={() => router.push('/(onboarding)/equipment' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}
