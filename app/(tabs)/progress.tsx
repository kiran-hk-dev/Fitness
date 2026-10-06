import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Muted, ActionCard, BottomSpace, TopSpace, PageHeader, SectionTitle } from '../../src/components/ui';
import { PoseSlideshow } from '../../src/components/ExercisePhoto';
import { Colors, gridRow, cell } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';
import { useActivity } from '../../src/hooks/useActivity';
import { CountUp, AnimatedBar } from '../../src/components/ActivityVisuals';
import { STEP_MILESTONES, milestonesReached } from '../../src/utils/steps';

const LINKS = [
  { title: 'Weight graph', icon: 'trending-up-outline', route: '/progress/weight' },
  { title: 'Activity graph', icon: 'bar-chart-outline', route: '/progress/strength' },
  { title: 'Measurements', icon: 'body-outline', route: '/progress/measurements' },
  { title: 'Habits', icon: 'checkmark-circle-outline', route: '/progress/habits' },
  { title: 'Monthly review', icon: 'calendar-outline', route: '/progress/monthly-review' },
  { title: 'Share my day', icon: 'share-social-outline', route: '/progress/share' },
] as const;

/** 3-up grid: fixed percentage so items always sit on one aligned row. */
const GRID_TILE = cell(3);

export default function ProgressTab() {
  const router = useRouter();
  const { today, unlocked } = useActivity();
  const earned = new Set([...unlocked, ...milestonesReached(today.steps).map((m) => m.code)]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <PageHeader title="Progress" subtitle="Graphs, badges and trends" icon="stats-chart-outline" />

      {/* Badges sit at the top of Progress — they are the reward loop. */}
      <Pressable onPress={() => router.push('/activity' as any)}>
        <Card accent={Colors.primary}>
          <View style={useStyles().badgeHead}>
            <View style={{ flex: 1 }}>
              <Text style={useStyles().badgeTitle}>
                {earned.size} of {STEP_MILESTONES.length} badges
              </Text>
              <Muted>Steps, water and running all roll up here</Muted>
            </View>
            <Text style={useStyles().badgePct}>{Math.round((earned.size / STEP_MILESTONES.length) * 100)}%</Text>
          </View>
          <AnimatedBar value={earned.size / STEP_MILESTONES.length} height={12} style={{ marginTop: 10 }} />
          <View style={useStyles().badgeRow}>
            {STEP_MILESTONES.map((m) => (
              <View
                key={m.code}
                style={[useStyles().chip, { width: `${100 / STEP_MILESTONES.length}%`, marginRight: 0 }]}
              >
                <View
                  style={[
                    useStyles().chipInner,
                    earned.has(m.code) && { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
                  ]}
                >
                  <Text style={{ fontSize: 15 }}>{earned.has(m.code) ? m.emoji : '🔒'}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={useStyles().today}>
            Today: <CountUp to={today.steps} style={{ color: Colors.text, fontWeight: '900' }} /> steps ·{' '}
            {today.waterMl} ml · {today.runKm} km
          </Text>
        </Card>
      </Pressable>

      <PoseSlideshow poseIds={['child', 'bridge', 'catcow', 'boat']} height={150} />

      <SectionTitle title="Track" icon="stats-chart-outline" />
      <View style={useStyles().grid}>
        {LINKS.map((l) => (
          <Pressable key={l.title} style={useStyles().tile} onPress={() => router.push(l.route as any)}>
            <AppIcon name={l.icon as any} size={24} color={Colors.primary} />
            <Text style={useStyles().tileText}>{l.title}</Text>
          </Pressable>
        ))}
      </View>

      <ActionCard title="Achievement map" desc="The full 1k → 10k path" icon="map-outline" onPress={() => router.push('/activity' as any)} />
      <ActionCard title="Photos (private)" desc="Progress pictures, only you" icon="camera-outline" onPress={() => router.push('/progress/photos' as any)} />
      <BottomSpace />
    </ScrollView>
  );
}

const useStyles = () => StyleSheet.create({
  badgeHead: { flexDirection: 'row', alignItems: 'center' },
  badgeTitle: { color: Colors.text, fontWeight: '900', fontSize: 19 },
  badgePct: { color: Colors.primary, fontWeight: '900', fontSize: 22 },
  badgeRow: { flexDirection: 'row', marginTop: 12 },
  chip: { alignItems: 'center', paddingHorizontal: 2 },
  chipInner: { width: '100%', aspectRatio: 1, maxWidth: 38, borderRadius: 19, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  today: { color: Colors.muted, fontSize: 12, fontWeight: '700', marginTop: 12 },
  grid: { ...gridRow(), marginVertical: 8 },
  tile: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, alignItems: 'center', ...GRID_TILE },
  tileText: { color: Colors.text, fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
});