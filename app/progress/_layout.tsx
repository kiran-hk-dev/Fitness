import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

// Gives every Progress screen a top navigation bar with back button + title.
export default function ProgressLayout() {
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
      <Stack.Screen name="weight" options={{ title: 'Weight + Height' }} />
      <Stack.Screen name="measurements" options={{ title: 'Measurements' }} />
      <Stack.Screen name="strength" options={{ title: 'Strength' }} />
      <Stack.Screen name="habits" options={{ title: 'Habits' }} />
      <Stack.Screen name="photos" options={{ title: 'Photos' }} />
      <Stack.Screen name="monthly-review" options={{ title: 'Monthly Review' }} />
      <Stack.Screen name="share" options={{ title: 'Share My Day' }} />
    </Stack>
  );
}
