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

// Gives every Workouts screen a top navigation bar with back button + title.
export default function WorkoutsLayout() {
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
      <Stack.Screen name="plans" options={{ title: 'Pick Your Level' }} />
      <Stack.Screen name="library" options={{ title: 'Exercise Library', headerRight: () => <HeaderAddButton route="/workouts/add" /> }} />
      <Stack.Screen name="[id]" options={{ title: 'Exercise Guide' }} />
      <Stack.Screen name="active" options={{ title: 'Active Workout' }} />
      <Stack.Screen name="summary" options={{ title: 'Workout Summary' }} />
      <Stack.Screen name="history" options={{ title: 'Workout History' }} />
      <Stack.Screen name="add" options={{ title: 'Add Exercise' }} />
    </Stack>
  );
}
