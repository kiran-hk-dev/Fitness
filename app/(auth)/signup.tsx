import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Field, SubmitButton, AuthHeader, Muted } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { ensureProfile } from '../../src/lib/tracking';
import { toast } from '../../src/components/Toast';
import { AuthBackdrop } from '../../src/components/AuthBackdrop';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const signup = async () => {
    if (!email.includes('@')) return setErr('Enter a valid email address.');
    if (password.length < 6) return setErr('Password needs at least 6 characters.');
    setErr('');
    setBusy(true);
    // 1) Create Supabase auth account
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    // If email confirmation is ON in Supabase, there is NO session yet —
    // sending the user to onboarding would fail every save with "Not signed in".
    if (!data.session) {
      setBusy(false);
      toast('Account created — confirm your email, then log in ✓');
      return router.replace('/(auth)/login' as any);
    }
    // 2) Session exists → store user row in Supabase so weight/height/training has an owner
    try {
      await ensureProfile(name.trim() || undefined);
    } catch (e: any) {
      console.warn('profile upsert failed', e?.message);
    }
    setBusy(false);
    toast('Account created ✓');
    router.replace('/(onboarding)/profile' as any);
  };

  return (
    <View style={useStyles().wrap}>
      <AuthBackdrop />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthHeader headline="Train for life" compact />
        <Card>
          <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
          <Field label="Email" value={email} onChangeText={(t) => { setEmail(t); setErr(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={(t) => { setPassword(t); setErr(''); }} placeholder="Min. 6 characters" secureTextEntry error={err} />
        </Card>
        <SubmitButton title="Sign up" loading={busy} onPress={signup} />
        <Muted style={{ textAlign: 'center', marginTop: 10 }}>General wellness guidance only.</Muted>
      </ScrollView>
    </View>
  );
}
const useStyles = () => StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: 'transparent' },
});
