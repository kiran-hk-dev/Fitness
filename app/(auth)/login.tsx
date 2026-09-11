import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Field, SubmitButton, AuthHeader, LinkRow } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
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
    if (password.length < 6) return setErr('Password needs at least 6 characters.');
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setErr(error.message + ' (Just signed up? Confirm your email first.)');
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
