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

// Gives every Nutrition screen a top navigation bar with back button + title.
export default function NutritionLayout() {
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
      <Stack.Screen name="logger" options={{ title: 'Log Meal' }} />
      <Stack.Screen name="search" options={{ title: 'Diet Items', headerRight: () => <HeaderAddButton route="/nutrition/add-food" /> }} />
      <Stack.Screen name="plan" options={{ title: 'My Diet Plans' }} />
      <Stack.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Stack.Screen name="grocery" options={{ title: 'Grocery List' }} />
      <Stack.Screen name="recovery" options={{ title: 'Kind Reset' }} />
      <Stack.Screen name="add-food" options={{ title: 'Add Diet Item' }} />
    </Stack>
  );
}
