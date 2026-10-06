import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

export default function TrainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}