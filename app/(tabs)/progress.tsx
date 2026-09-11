import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Muted, ActionCard, BottomSpace, TopSpace, PageHeader} from '../../src/components/ui';
import { PoseSlideshow } from '../../src/components/ExercisePhoto';
import { Colors } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';

const LINKS = [
  { title: 'Share my day', icon: 'share-social-outline', route: '/progress/share' },
  { title: 'Weight graph', icon: 'trending-up-outline', route: '/progress/weight' },
  { title: 'Activity graph', icon: 'bar-chart-outline', route: '/progress/strength' },
  { title: 'Measurements', icon: 'body-outline', route: '/progress/measurements' },
  { title: 'Habits', icon: 'checkmark-circle-outline', route: '/progress/habits' },
  { title: 'Monthly review', icon: 'calendar-outline', route: '/progress/monthly-review' },
] as const;

export default function ProgressTab() {
  const router = useRouter();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <PageHeader title="Progress" subtitle="Graphs, photos and trends" icon="stats-chart-outline" />
      <PoseSlideshow poseIds={['child', 'bridge', 'catcow', 'boat']} height={150} />
      <View style={useStyles().grid}>
        {LINKS.map((l) => (
          <Pressable key={l.title} style={useStyles().tile} onPress={() => router.push(l.route as any)}>
            <AppIcon name={l.icon as any} size={24} color={Colors.primary} />
            <Text style={useStyles().tileText}>{l.title}</Text>
          </Pressable>
        ))}
      </View>
      <ActionCard title="Photos (private)" desc="Progress pictures, only you" icon="camera-outline" onPress={() => router.push('/progress/photos' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}

const useStyles = () => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  tile: { width: '31%', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, alignItems: 'center', margin: '1%' },
  tileText: { color: Colors.text, fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
});
