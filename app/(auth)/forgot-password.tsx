import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Field, SubmitButton, AuthHeader, LinkRow } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { AuthBackdrop } from '../../src/components/AuthBackdrop';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    if (!email.includes('@')) return setErr('Enter a valid email address.');
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    toast('Reset link sent — check your email ✓');
  };

  return (
    <View style={useStyles().wrap}>
      <AuthBackdrop />
      <AuthHeader headline="We'll email you a reset link" compact />
      <Card>
        <Field
          label="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); setErr(''); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={err}
        />
      </Card>
      <SubmitButton title="Send reset link" loading={busy} onPress={send} />
      <LinkRow links={[{ label: '← Back to login', onPress: () => router.push('/(auth)/login' as any) }]} />
    </View>
  );
}
const useStyles = () => StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: 'transparent' },
});
