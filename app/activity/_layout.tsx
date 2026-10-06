import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function ActivityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="steps" />
      <Stack.Screen name="water" />
      <Stack.Screen name="run" />
    </Stack>
  );
}