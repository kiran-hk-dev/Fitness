import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SubmitButton, LinkRow, AuthHeader } from '../../src/components/ui';
import { AuthBackdrop } from '../../src/components/AuthBackdrop';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={useStyles().wrap}>
      <AuthBackdrop />
      <AuthHeader headline="Train · Eat · Breathe · Repeat" />
      <View>
        <SubmitButton title="Get Started" icon="arrow-forward" onPress={() => router.push('/(auth)/signup' as any)} />
        <LinkRow links={[{ label: 'I already have an account', onPress: () => router.push('/(auth)/login' as any) }]} />
      </View>
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: 'space-between', backgroundColor: 'transparent', paddingTop: 84, paddingBottom: 36 },
});
