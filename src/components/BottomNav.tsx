import { View, Pressable, Text, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Colors } from '../theme';
import { AppIcon, AppIconName } from './AppIcon';

// Bottom navigation rendered on EVERY nested page (library, logger, yoga…),
// so the 5 main sections are always one tap away.
const TABS: { route: string; icon: AppIconName; label: string; match: (p: string) => boolean }[] = [
  { route: '/(tabs)', icon: 'home', label: 'Home', match: (p) => p === '/(tabs)' || p === '/(tabs)/index' || p === '/' },
  { route: '/(tabs)/workouts', icon: 'barbell', label: 'Workouts', match: (p) => p.includes('/workouts') || p.includes('/yoga') },
  { route: '/(tabs)/nutrition', icon: 'nutrition', label: 'Nutrition', match: (p) => p.includes('/nutrition') },
  { route: '/(tabs)/progress', icon: 'stats-chart', label: 'Progress', match: (p) => p.includes('/progress') },
  { route: '/(tabs)/profile', icon: 'person', label: 'Profile', match: (p) => p.includes('/profile') },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <View style={useStyles().bar}>
      {TABS.map((t) => {
        const on = t.match(pathname);
        return (
          <Pressable key={t.label} onPress={() => router.push(t.route as any)} style={useStyles().tab}>
            <AppIcon name={on ? t.icon : (`${t.icon}-outline` as any)} size={23} color={on ? Colors.primary : Colors.muted} />
            <Text style={[useStyles().label, { color: on ? Colors.primary : Colors.muted }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: Colors.bgSoft,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingVertical: 8, paddingBottom: 14,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});
