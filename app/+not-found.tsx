import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '../src/components/ui';
import { Colors } from '../src/theme';

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, padding: 20 }}>
      <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '800' }}>Screen not found</Text>
      <PrimaryButton title="Go home" onPress={() => router.replace('/(tabs)' as any)} />
    </View>
  );
}
