import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PageHeader, Card, Body, Muted, PrimaryButton, GhostButton, BigActionButton,
  BottomSpace, TopSpace, SectionTitle, Chip,
} from '../../src/components/ui';
import { RingProgress, CountUp, AnimatedBar } from '../../src/components/ActivityVisuals';
import { MilestoneMap } from '../../src/components/MilestoneMap';
import { Celebration } from '../../src/components/Celebration';
import { AppIcon } from '../../src/components/AppIcon';
import { useActivity } from '../../src/hooks/useActivity';
import {
  DEFAULT_STEP_TARGET, DEFAULT_WATER_TARGET, STEP_MILESTONES,
  goalProgress, waterProgress, stepsMessage, stepsToNext, milestonesReached,
} from '../../src/utils/steps';
import { toast } from '../../src/components/Toast';
import { Colors, gridRow, cell } from '../../src/theme';
import type { StepMilestone } from '../../src/utils/steps';

export default function ActivityHub() {
  const router = useRouter();
  const { today, unlocked, celebrating, refresh, addSteps, addWater, dismissCelebration } = useActivity();
  const [busy, setBusy] = useState(false);

  const goal = DEFAULT_STEP_TARGET;
  const waterGoal = DEFAULT_WATER_TARGET;
  const stepPct = goalProgress(today.steps, goal);
  const waterPct = waterProgress(today.waterMl, waterGoal);
  const earned = milestonesReached(today.steps).length;

  const quickSteps = useCallback(
    async (n: number) => {
      if (busy) return;
      setBusy(true);
      try {
        await addSteps(n);
        toast(`+${n.toLocaleString()} steps`);
      } catch (e: any) {
        toast(e?.message ?? 'Could not save', 'error');
      } finally {
        setBusy(false);
      }
    },
    [addSteps, busy],
  );

  const quickWater = useCallback(
    async (ml: number) => {
      if (busy) return;
      setBusy(true);
      try {
        await addWater(ml);
        toast(`+${ml} ml 💧`);
      } catch (e: any) {
        toast(e?.message ?? 'Could not save', 'error');
      } finally {
        setBusy(false);
      }
    },
    [addWater, busy],
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={Colors.primary} />}>
        <TopSpace height={44} />
        <Pressable style={s.back} onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="chevron-forward" size={20} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <PageHeader title="Activity" subtitle="Steps · water · running" icon="pulse-outline" />

        {/* Two rings side by side — the whole day at a glance */}
        <View style={s.ringRow}>
          <Card style={s.ringCard} accent={Colors.primary}>
            <Pressable style={{ alignItems: 'center' }} onPress={() => router.push('/activity/steps' as any)}>
              <RingProgress value={stepPct} size={128} thickness={13} color={Colors.primary} color2={Colors.accent} glow>
                <AppIcon name="footsteps-outline" size={18} color={Colors.primary} />
                <CountUp to={today.steps} style={s.ringVal} />
                <Text style={s.ringLab}>steps</Text>
              </RingProgress>
              <Text style={s.ringPct}>{Math.round(stepPct * 100)}% of {goal.toLocaleString()}</Text>
            </Pressable>
          </Card>
          <Card style={s.ringCard} accent={Colors.accent}>
            <Pressable style={{ alignItems: 'center' }} onPress={() => router.push('/activity/water' as any)}>
              <RingProgress value={waterPct} size={128} thickness={13} color={Colors.accent} color2="#38BDF8">
                <AppIcon name="water-outline" size={18} color={Colors.accent} />
                <CountUp to={today.waterMl} style={s.ringVal} />
                <Text style={s.ringLab}>ml</Text>
              </RingProgress>
              <Text style={s.ringPct}>{Math.round(waterPct * 100)}% of {waterGoal.toLocaleString()}</Text>
            </Pressable>
          </Card>
        </View>

        {/* One-tap logging */}
        <Card>
          <SectionTitle title="Quick add" icon="add-circle" right="no menu needed" />
          <Text style={s.quickLab}>STEPS</Text>
          <View style={s.chipRow}>
            {[500, 1000, 2000, 5000].map((n) => (
              <Pressable key={n} onPress={() => quickSteps(n)} disabled={busy} style={({ pressed }) => [s.pill, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}>
                <AppIcon name="add" size={14} color={Colors.primary} />
                <Text style={s.pillText}>{n >= 1000 ? `${n / 1000}k` : n}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[s.quickLab, { marginTop: 14 }]}>WATER</Text>
          <View style={s.chipRow}>
            {[200, 300, 500].map((ml) => (
              <Pressable key={ml} onPress={() => quickWater(ml)} disabled={busy} style={({ pressed }) => [s.pill, { borderColor: Colors.accent }, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}>
                <AppIcon name="add" size={14} color={Colors.accent} />
                <Text style={[s.pillText, { color: Colors.accent }]}>{ml} ml</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Running */}
        <SectionTitle title="Running" icon="run-outline" />
        <Card>
          <View style={s.runRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.runNum}><CountUp to={today.runKm} style={{ color: Colors.text, fontWeight: '900', fontSize: 26 }} /> km today</Text>
              <Muted>{today.runMin} min · {today.runCalories} kcal</Muted>
            </View>
            <PrimaryButton title="Log a run" icon="play" onPress={() => router.push('/activity/run' as any)} style={{ marginVertical: 0, paddingVertical: 12 }} />
          </View>
        </Card>

        {/* The achievement map */}
        <SectionTitle title="Achievement map" icon="map-outline" right={`${earned} of ${STEP_MILESTONES.length}`} />
        <Card>
          <Body>Every badge sits on the path. Hit 1k for your first medal, 10k for the big VICTORY.</Body>
          <MilestoneMap
            steps={today.steps}
            unlocked={unlocked}
            perRow={4}
            onPressLocked={(m: StepMilestone) =>
              toast(
                today.steps >= m.steps
                  ? `${m.title} is already yours!`
                  : `${m.steps.toLocaleString()} steps unlocks ${m.title}. ${stepsToNext(today.steps).toLocaleString()} more for your next badge.`,
              )
            }
          />
          <Text style={s.mapHint}>{stepsMessage(today.steps, goal)}</Text>
        </Card>

        <SectionTitle title="Badge shelf" icon="ribbon-outline" right={`${earned} earned`} />
        <Card>
          <View style={s.shelf}>
            {STEP_MILESTONES.map((m) => {
              const got = milestonesReached(today.steps).some((x) => x.code === m.code) || unlocked.includes(m.code);
              return (
                <View key={m.code} style={[s.shelfTile, got && { borderColor: m.victory ? '#FFC93C' : Colors.primary, backgroundColor: m.victory ? '#FFC93C18' : Colors.primarySoft }]}>
                  <Text style={{ fontSize: 24 }}>{got ? m.emoji : '🔒'}</Text>
                  <Text style={[s.shelfSteps, got && { color: m.victory ? '#FFC93C' : Colors.primary }]}>
                    {m.steps >= 1000 ? `${m.steps / 1000}k` : m.steps}
                  </Text>
                  <Text style={s.shelfTitle} numberOfLines={2}>{m.title}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <SectionTitle title="Go deeper" icon="layers-outline" />
        <View style={s.grid}>
          <BigActionButton style={s.half} title="Step detail" hint="Badges, goal, history" icon="footsteps-outline" onPress={() => router.push('/activity/steps' as any)} />
          <BigActionButton style={s.half} title="Water detail" hint="Bottles and target" icon="water-outline" color={Colors.accent} onPress={() => router.push('/activity/water' as any)} />
          <BigActionButton style={s.half} title="Run detail" hint="Timer, pace, week" icon="run-outline" color="#F472B6" onPress={() => router.push('/activity/run' as any)} />
          <BigActionButton style={s.half} title="Charts" hint="Steps + weight graphs" icon="stats-chart-outline" color="#A78BFA" onPress={() => router.push('/progress/strength' as any)} />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          <Chip label="Counts sync to your account" icon="cloud-upload-outline" color={Colors.muted} />
        </View>
        <GhostButton title="Refresh from server" icon="refresh-outline" onPress={refresh} />
        <BottomSpace />
      </ScrollView>

      <Celebration
        milestone={celebrating}
        steps={today.steps}
        onClose={dismissCelebration}
        nextLabel={
          milestonesReached(today.steps).length < STEP_MILESTONES.length
            ? `${stepsToNext(today.steps).toLocaleString()} more for the next badge.`
            : undefined
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: { color: Colors.text, fontWeight: '800', fontSize: 15, marginLeft: 2 },
  ringRow: { flexDirection: 'row', marginHorizontal: -4 },
  ringCard: { flex: 1, marginHorizontal: 4, paddingVertical: 16, paddingHorizontal: 6 },
  ringVal: { color: Colors.text, fontWeight: '900', fontSize: 20, marginTop: 2 },
  ringLab: { color: Colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  ringPct: { color: Colors.muted, fontSize: 11, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  quickLab: { color: Colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 7 },
  chipRow: gridRow(),
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySoft, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 14, margin: 4 },
  pillText: { color: Colors.primary, fontWeight: '900', fontSize: 14, marginLeft: 4 },
  runRow: { flexDirection: 'row', alignItems: 'center' },
  runNum: { color: Colors.text, fontWeight: '900', fontSize: 26 },
  mapHint: { color: Colors.text, fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 6 },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  shelfTile: { width: '23%', minWidth: 74, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, margin: '1%' },
  shelfSteps: { color: Colors.muted, fontWeight: '900', fontSize: 13, marginTop: 4 },
  shelfTitle: { color: Colors.muted, fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 1 },
  grid: gridRow(),
  half: cell(2),
});