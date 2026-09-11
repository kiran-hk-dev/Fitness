import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { AppIcon } from '../../src/components/AppIcon';
import { Colors } from '../../src/theme';

// Always-visible + button (no scrolling needed to add).
function HeaderAddButton({ route }: { route: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(route as any)} hitSlop={14} style={{ marginRight: 2 }}>
      <AppIcon name="add-circle-outline" size={27} color={Colors.primary} />
    </Pressable>
  );
}

// Gives every Yoga screen a top navigation bar with back button + title.
export default function YogaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.bgSoft },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.text, fontWeight: '800' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Yoga', headerRight: () => <HeaderAddButton route="/yoga/add" /> }} />
      <Stack.Screen name="[id]" options={{ title: 'Yoga Session' }} />
      <Stack.Screen name="active" options={{ title: 'Yoga Session' }} />
      <Stack.Screen name="history" options={{ title: 'Yoga History' }} />
      <Stack.Screen name="add" options={{ title: 'Add Yoga' }} />
    </Stack>
  );
}
