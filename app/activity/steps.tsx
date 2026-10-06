import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PageHeader, Card, H2, Body, Muted, PrimaryButton, GhostButton, PickButton, PickRow,
  BottomSpace, TopSpace, SectionTitle, ActionCard, DisclaimerBanner,
} from '../../src/components/ui';
import { RingProgress, CountUp, AnimatedBar } from '../../src/components/ActivityVisuals';
import { Celebration } from '../../src/components/Celebration';
import { AppIcon } from '../../src/components/AppIcon';
import { useActivity } from '../../src/hooks/useActivity';
import {
  DEFAULT_STEP_TARGET, goalProgress, stepsMessage, nextMilestone,
  tierProgress, stepsToNext,
} from '../../src/utils/steps';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';

const QUICK_STEPS = [500, 1000, 2000, 5000];
const GOAL_CHOICES = [5000, 8000, 10000, 15000];

export default function StepsScreen() {
  const router = useRouter();
  const { today, unlocked, celebrating, refresh, addSteps, undoSteps, dismissCelebration } = useActivity();
  const [goal, setGoal] = useState(DEFAULT_STEP_TARGET);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);

  const progress = goalProgress(today.steps, goal);
  const next = nextMilestone(today.steps);
  const earned = new Set(unlocked).size;

  const log = async (n: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await addSteps(n);
      toast(`+${Math.round(n).toLocaleString()} steps logged`);
    } catch (e: any) {
      toast(e?.message ?? 'Could not save steps', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={Colors.primary} />}>
        <TopSpace height={44} />
        <Pressable style={s.back} onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="chevron-forward" size={20} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <PageHeader title="Steps" subtitle="Walk more, unlock more" icon="footsteps-outline" />

        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <RingProgress value={progress} size={228} thickness={18} color={Colors.primary} color2={Colors.accent} glow>
            <CountUp to={today.steps} style={s.bigSteps} />
            <Text style={s.bigLabel}>steps today</Text>
            <Text style={s.bigGoal}>goal {goal.toLocaleString()}</Text>
          </RingProgress>
          <Text style={s.msg}>{stepsMessage(today.steps, goal)}</Text>
          {today.steps >= goal ? (
            <View style={s.donePill}>
              <AppIcon name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={s.doneText}>Daily goal smashed 🎉</Text>
            </View>
          ) : null}
        </Card>

        {next ? (
          <Card>
            <View style={s.tierHead}>
              <Text style={s.tierTitle}>Next badge · {next.title}</Text>
              <Text style={s.tierNum}>{stepsToNext(today.steps).toLocaleString()} to go</Text>
            </View>
            <AnimatedBar value={tierProgress(today.steps)} color={Colors.accent} height={14} />
            <Muted>{next.subtitle} — once unlocked the badge is yours for good.</Muted>
          </Card>
        ) : (
          <Card>
            <Text style={s.tierTitle}>Every badge unlocked 👑</Text>
            <Muted>You cleared the whole map. Keep the streak alive.</Muted>
          </Card>
        )}

        <SectionTitle title="Add steps" icon="add-circle" />
        <View style={s.uuickRow}>
          {QUICK_STEPS.map((n) => (
            <Pressable
              key={n}
              onPress={() => log(n)}
              disabled={busy}
              style={({ pressed }) => [s.uuick, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }, busy && { opacity: 0.6 }]}
            >
              <Text style={s.uuickNum}>+{n >= 1000 ? `${n / 1000}k` : n}</Text>
              <Text style={s.uuickLab}>steps</Text>
            </Pressable>
          ))}
        </View>

        <Card accent={Colors.accent}>
          <H2>Or type it in</H2>
          <Body>Use this for a walk you forgot to tap along the way.</Body>
          <View style={s.customRow}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="e.g. 1250"
              placeholderTextColor={Colors.muted}
              keyboardType="number-pad"
              style={s.input}
            />
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Add" icon="checkmark" onPress={() => {
                const n = Number(custom);
                if (!Number.isFinite(n) || n <= 0) return toast('Type how many steps', 'error');
                setCustom('');
                log(n);
              }} loading={busy} />
            </View>
          </View>
          <GhostButton title="Undo last entry" icon="refresh-outline" onPress={undoSteps} />
        </Card>

        <SectionTitle title="Badges" icon="ribbon-outline" right={`${earned} unlocked`} />
        <Card>
          <Body>
            Badges pop the moment you pass them: 1k, 2.5k, 5k, 7.5k, then the big{' '}
            <Text style={{ color: Colors.primary, fontWeight: '900' }}>10K VICTORY</Text>.
          </Body>
          <View style={s.miniRow}>
            {[1000, 5000, 10000, 20000].map((m) => {
              const done = today.steps >= m || new Set(unlocked).has(
                m === 1000 ? 'steps_1k' : m === 5000 ? 'steps_5k' : m === 10000 ? 'steps_10k' : 'steps_20k',
              );
              return (
                <View key={m} style={[s.miniBadge, done && { borderColor: Colors.primary, backgroundColor: Colors.primarySoft }]}>
                  <Text style={{ fontSize: 18 }}>{done ? '🏅' : '🔒'}</Text>
                  <Text style={[s.miniBadgeText, done && { color: Colors.primary }]}>
                    {m >= 1000 ? `${m / 1000}k` : m}
                  </Text>
                </View>
              );
            })}
          </View>
          <ActionCard
            title="Open the full achievement map"
            desc="Every badge on one path"
            icon="map-outline"
            onPress={() => router.push('/activity' as any)}
          />
        </Card>

        <SectionTitle title="Daily goal" icon="speedometer-outline" />
        <PickRow>
          {GOAL_CHOICES.map((g) => (
            <PickButton key={g} label={g >= 1000 ? `${g / 1000}k` : String(g)} selected={goal === g} onPress={() => setGoal(g)} />
          ))}
        </PickRow>

        <DisclaimerBanner text="Phone step counts are estimates — treat them as a guide, not a scoreboard. Break up long sitting with a short walk every 30–60 minutes." />
        <BottomSpace />
      </ScrollView>

      <Celebration
        milestone={celebrating}
        steps={today.steps}
        onClose={dismissCelebration}
        nextLabel={next ? `${stepsToNext(today.steps).toLocaleString()} more for ${next.title}.` : undefined}
      />
    </View>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: { color: Colors.text, fontWeight: '800', fontSize: 15, marginLeft: 2 },
  bigSteps: { color: Colors.text, fontWeight: '900', fontSize: 46 },
  bigLabel: { color: Colors.muted, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: -4 },
  bigGoal: { color: Colors.faint, fontSize: 12, fontWeight: '700', marginTop: 2 },
  msg: { color: Colors.text, fontWeight: '700', fontSize: 14, marginTop: 16, textAlign: 'center', paddingHorizontal: 12 },
  donePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySoft, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, marginTop: 10 },
  doneText: { color: Colors.primary, fontWeight: '800', fontSize: 13, marginLeft: 6 },
  tierHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tierTitle: { color: Colors.text, fontWeight: '800', fontSize: 16 },
  tierNum: { color: Colors.primary, fontWeight: '800', fontSize: 13 },
  uuickRow: { flexDirection: 'row', marginHorizontal: -4 },
  uuick: { flex: 1, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginHorizontal: 4, elevation: 3 },
  uuickNum: { color: Colors.onPrimary, fontWeight: '900', fontSize: 20 },
  uuickLab: { color: Colors.onPrimary, fontSize: 11, fontWeight: '700', opacity: 0.85 },
  customRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 18, fontWeight: '800',
    color: Colors.text, marginRight: 10, marginTop: 6,
  },
  miniRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  miniBadge: { width: 72, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, marginTop: 8 },
  miniBadgeText: { color: Colors.muted, fontWeight: '800', fontSize: 12, marginTop: 4 },
  
});
