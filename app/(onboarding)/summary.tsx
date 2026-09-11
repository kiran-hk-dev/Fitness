import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Card, Body, Muted, BottomSpace, TopSpace} from '../../src/components/ui';
import { SlideButton } from '../../src/components/SlideButton';
import { buildTargets } from '../../src/utils/nutrition';
import { useAppStore } from '../../src/store/useAppStore';
import { useOnboardingStore } from '../../src/store/useOnboardingStore';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/theme';

export default function Summary() {
  const router = useRouter();
  const set = useAppStore((s) => s.set);
  const { goal, diet, location, level } = useOnboardingStore();
  const [busy, setBusy] = useState(false);
  const t = buildTargets({ weightKg: 70, heightCm: 170, activity: 'moderate', goal: goal as any });

  const finish = async () => {
    setBusy(true);
    try {
      // Save real onboarding picks to the Supabase account
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          goal, diet_type: diet, workout_level: level, workout_location: location,
        }).eq('id', user.id);
      }
    } catch {}
    setBusy(false);
    set({ onboarded: true });
    router.replace('/(tabs)' as any);
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: Colors.bg }}>
      <TopSpace />
      <H1>Your plan ✅</H1>
      <Card>
        <Body>🎯 {goal} • 🍛 {diet} • 📍 {location} • ⚡ {level}</Body>
      </Card>
      <Card>
        <Body>Calories ~{t.calories} • Protein ~{t.protein_g}g • Carbs ~{t.carbs_g}g • Fat ~{t.fat_g}g • Fiber ~{t.fiber_g}g • Water ~{t.water_ml}ml</Body>
        <Muted>Editable anytime in Profile. Educational estimates, not prescriptions.</Muted>
      </Card>
      <SlideButton title="Slide to start FitLife 360" onComplete={finish} />
      <BottomSpace />
    </ScrollView>
  );
}
