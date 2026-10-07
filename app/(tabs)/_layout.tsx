import { Tabs } from 'expo-router';
import { Colors } from '../../src/theme';
import { AppIcon, AppIconName } from '../../src/components/AppIcon';

const ICONS: Record<string, { on: AppIconName; off: AppIconName }> = {
  index: { on: 'home', off: 'home-outline' },
  workouts: { on: 'barbell', off: 'barbell-outline' },
  nutrition: { on: 'nutrition', off: 'nutrition-outline' },
  progress: { on: 'stats-chart', off: 'stats-chart-outline' },
  profile: { on: 'person', off: 'person-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.bgSoft,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const pair = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };
          return <AppIcon name={focused ? pair.on : pair.off} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
