import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Field, SubmitButton, AuthHeader, Muted } from '../../src/components/ui';
import { signUpAndReport, isAlreadyRegistered } from '../../src/lib/auth';
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

    const res = await signUpAndReport({ email: email.trim(), password });

    // This project runs with email autoconfirm on, so Supabase normally hands
    // back a session straight away. Only mention the inbox when it genuinely
    // did not — otherwise the app tells people to wait for a mail that will
    // never arrive.
    if (res.status === 'confirm-email') {
      setBusy(false);
      toast('Account created — confirm your email, then log in ✓');
      return router.replace('/(auth)/login' as any);
    }

    if (res.status === 'error') {
      setBusy(false);
      setErr(
        isAlreadyRegistered(res.message)
          ? 'That email is already registered. Try logging in instead.'
          : res.message,
      );
      return;
    }

    // Session exists → make sure a profiles row exists so weight/height/training has an owner
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
