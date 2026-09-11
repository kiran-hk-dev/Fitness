import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Card, Body, ActionCard, BottomSpace, TopSpace} from '../../src/components/ui';
import { Colors } from '../../src/theme';

export default function ScheduleStep() {
  const router = useRouter();
  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: Colors.bg }}>
      <TopSpace />
      <H1>Step 6/6 — Schedule & targets</H1>
      <Card><Body>3 workouts/week • 8000 steps • 2500 ml water • 8h sleep (editable).</Body></Card>
      <ActionCard title="See my plan →" desc="Your targets summary" icon="clipboard-outline" onPress={() => router.push('/(onboarding)/summary' as any)} />
          <BottomSpace />
    </ScrollView>
  );
}
