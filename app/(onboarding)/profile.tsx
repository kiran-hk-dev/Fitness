import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { H1, Card, Body, Field, PrimaryButton, DisclaimerBanner, BottomSpace, TopSpace } from '../../src/components/ui';
import { HEALTH_DISCLAIMER } from '../../src/utils/safety';
import { useAppStore } from '../../src/store/useAppStore';
import { supabase } from '../../src/lib/supabase';
import { saveWeightHeight, savePendingProfile } from '../../src/lib/tracking';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';

export default function ProfileStep() {
  const router = useRouter();
  const set = useAppStore((s) => s.set);
  const [name, setName] = useState('');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('70');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const next = async () => {
    const h = Number(height);
    const w = Number(weight);
    if (!name.trim()) return setErr('Please tell us your name.');
    if (!(h > 50 && h < 300) || !(w > 20 && w < 400)) {
      return setErr('Height 50–300 cm, weight 20–400 kg.');
    }
    setErr('');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const entry = { weightKg: w, heightCm: h, displayName: name.trim() || undefined };
      if (user) {
        // Signed in → store userdata (weight + height) in Supabase under this account
        await saveWeightHeight(entry);
        toast('Profile saved ✓');
      } else {
        // Signed out (e.g. email not confirmed yet) → keep on device,
        // auto-uploaded at next login. Nothing is lost.
        await savePendingProfile(entry);
        Alert.alert(
          'Not signed in — saved on device 📱',
          'Your weight/height is kept on this device and will upload automatically when you log in.\n\nTip: confirm your signup email first, or turn OFF "Confirm email" in Supabase Dashboard → Authentication → Providers → Email (dev).',
          [
            { text: 'Continue', style: 'default' },
            { text: 'Go to Login', onPress: () => router.push('/(auth)/login' as any) },
          ]
        );
      }
      set({ onboarded: false });
    } catch (e: any) {
      try {
        await savePendingProfile({ weightKg: w, heightCm: h, displayName: name.trim() || undefined });
      } catch {}
      toast('Saved on device — will sync at login', 'info');
    } finally {
      setSaving(false);
    }
    router.push('/(onboarding)/goal' as any);
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: Colors.bg }}>
      <TopSpace />
      <H1>Step 1/6 — Profile</H1>
      <DisclaimerBanner text={HEALTH_DISCLAIMER + ' Consent: recommendations are general wellness guidance.'} />
      <Card>
        <Field label="Name" value={name} onChangeText={(t) => { setName(t); setErr(''); }} placeholder="Your name" />
        <Field label="Height (cm)" value={height} onChangeText={(t) => { setHeight(t); setErr(''); }} placeholder="170" keyboardType="numeric" />
        <Field label="Weight (kg)" value={weight} onChangeText={(t) => { setWeight(t); setErr(''); }} placeholder="70" keyboardType="numeric" error={err} />
        <Body>✓ Saved to your Supabase account (profiles + body_metrics history).</Body>
      </Card>
      <PrimaryButton title="Save & Continue → Goal" loading={saving} onPress={next} />
      <BottomSpace />
    </ScrollView>
  );
}
