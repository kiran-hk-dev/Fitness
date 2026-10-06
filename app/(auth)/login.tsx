import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Field, SubmitButton, AuthHeader, LinkRow } from '../../src/components/ui';
import { signInAndReport } from '../../src/lib/auth';
import { ensureProfile, syncPendingProfile } from '../../src/lib/tracking';
import { toast } from '../../src/components/Toast';
import { AuthBackdrop } from '../../src/components/AuthBackdrop';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const login = async () => {
    if (!email.includes('@')) return setErr('Enter a valid email address.');
    if (!password) return setErr('Enter your password.');
    setErr('');
    setBusy(true);
    const res = await signInAndReport({ email: email.trim(), password });
    if (res.status === 'error') {
      setBusy(false);
      // The helper already words the "confirm your email" case correctly and
      // omits it for every other failure.
      setErr(res.message);
      return;
    }
    try {
      await ensureProfile();
      if (await syncPendingProfile()) toast('Synced ✓ — saved weight uploaded');
    } catch {}
    setBusy(false);
    toast('Welcome back ✓');
    router.replace('/(tabs)' as any);
  };

  return (
    <View style={useStyles().wrap}>
      <AuthBackdrop />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthHeader headline="Welcome back" compact />
        <Card>
          <Field label="Email" value={email} onChangeText={(t) => { setEmail(t); setErr(''); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={(t) => { setPassword(t); setErr(''); }} placeholder="••••••••" secureTextEntry error={err} />
        </Card>
        <SubmitButton title="Login" loading={busy} onPress={login} />
        <LinkRow
          links={[
            { label: 'Forgot password?', onPress: () => router.push('/(auth)/forgot-password' as any) },
            { label: 'Create account', onPress: () => router.push('/(auth)/signup' as any) },
          ]}
        />
      </ScrollView>
    </View>
  );
}
const useStyles = () => StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: 'transparent' },
});
