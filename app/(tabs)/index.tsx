import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card, Body, Muted, PrimaryButton, GhostButton, DisclaimerBanner,
  BottomSpace, ActionCard, TopSpace, PageHeader, Field, BigActionButton, ButtonGrid, Chip, SectionTitle,
} from '../../src/components/ui';
import { ExerciseGallery } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { buildTargets } from '../../src/utils/nutrition';
import { SPOT_REDUCTION_NOTE } from '../../src/utils/progression';
import { getDailySummary, pruneOldLogs, type DailySummary } from '../../src/lib/tracking';
import { getCustomTargets, setCustomTargets, type CustomTargets } from '../../src/lib/targets';
import { useActivity } from '../../src/hooks/useActivity';
import { RingProgress, CountUp } from '../../src/components/ActivityVisuals';
import { BouncyPress, FadeIn } from '../../src/components/Motion';
import { Celebration } from '../../src/components/Celebration';
import {
  DEFAULT_STEP_TARGET, DEFAULT_WATER_TARGET, goalProgress, waterProgress,
  stepsMessage, nextMilestone, stepsToNext, milestonesReached, STEP_MILESTONES,
} from '../../src/utils/steps';
import { toast } from '../../src/components/Toast';
import { Colors, gridRow, cell } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';

/**
 * Home = one glance. Two animated rings (steps + water), the next badge,
 * then four big obvious buttons. Everything secondary is collapsed behind
 * "More" so the screen is not a wall of text.
 */
export default function Home() {
  const router = useRouter();
  const activity = useActivity();
  const { today, celebrating, refresh, addSteps, addWater, dismissCelebration, unlocked } = activity;
  const [busy, setBusy] = useState(false);

  const t = buildTargets({ weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'fat_loss' });
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [custom, setCustom] = useState<CustomTargets | null>(null);
  const [editing, setEditing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [fCal, setFCal] = useState('');
  const [fPro, setFPro] = useState('');

  const move = EXERCISES[Math.floor(Date.now() / 86400000) % EXERCISES.length];

  const load = useCallback(async () => {
    try { setSummary(await getDailySummary()); } catch { setSummary(null); }
    try { setCustom(await getCustomTargets()); } catch {}
    await refresh();
    pruneOldLogs().catch(() => {});
  }, [refresh]);
  React.useEffect(() => { load(); }, [load]);

  const cal = custom?.calories ?? t.calories;
  const pro = custom?.protein_g ?? t.protein_g;
  const stepGoal = DEFAULT_STEP_TARGET;
  const waterGoal = DEFAULT_WATER_TARGET;
  const stepPct = goalProgress(today.steps, stepGoal);
  const waterPct = waterProgress(today.waterMl, waterGoal);
  const next = nextMilestone(today.steps);
  const earned = milestonesReached(today.steps).length;

  const openEditor = () => {
    setFCal(String(cal));
    setFPro(String(pro));
    setEditing((v) => !v);
  };

  const saveTargets = async () => {
    const c = Number(fCal), p = Number(fPro);
    if (!(c > 800 && c < 8000)) return toast('Calories must be 800–8000', 'error');
    if (!(p >= 0 && p < 500)) return toast('Protein must be 0–500 g', 'error');
    await setCustomTargets({ calories: Math.round(c), protein_g: Math.round(p), water_ml: waterGoal });
    setCustom({ calories: Math.round(c), protein_g: Math.round(p), water_ml: waterGoal });
    setEditing(false);
    toast('Targets saved ✓');
  };

  const quick = async (fn: () => Promise<unknown>, okMsg: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast(okMsg);
    } catch (e: any) {
      toast(e?.message ?? 'Could not save', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.primary} />}>
        <TopSpace />
        <FadeIn>
          <PageHeader title="Today" subtitle="Move · eat · sleep · repeat" icon="sunny-outline" />
        </FadeIn>

        {/* ---------- rings: steps + water ---------- */}
        <View style={s.ringRow}>
          <Card style={s.ringCard} accent={Colors.primary}>
            <Pressable style={{ alignItems: 'center' }} onPress={() => router.push('/activity/steps' as any)}>
              <RingProgress value={stepPct} size={126} thickness={13} color={Colors.primary} color2={Colors.accent} glow>
                <AppIcon name="footsteps-outline" size={17} color={Colors.primary} />
                <CountUp to={today.steps} style={s.ringVal} />
                <Text style={s.ringLab}>steps</Text>
              </RingProgress>
              <Text style={s.ringPct}>{Math.round(stepPct * 100)}% of {stepGoal.toLocaleString()}</Text>
              <View style={s.tapHint}>
                <AppIcon name="chevron-forward" size={12} color={Colors.muted} />
                <Text style={s.tapHintText}>open</Text>
              </View>
            </Pressable>
          </Card>

          <Card style={s.ringCard} accent={Colors.accent}>
            <Pressable style={{ alignItems: 'center' }} onPress={() => router.push('/activity/water' as any)}>
              <RingProgress value={waterPct} size={126} thickness={13} color={Colors.accent} color2="#38BDF8">
                <AppIcon name="water-outline" size={17} color={Colors.accent} />
                <CountUp to={today.waterMl} style={s.ringVal} />
                <Text style={s.ringLab}>ml</Text>
              </RingProgress>
              <Text style={s.ringPct}>{Math.round(waterPct * 100)}% of {waterGoal.toLocaleString()}</Text>
              <View style={s.tapHint}>
                <AppIcon name="chevron-forward" size={12} color={Colors.muted} />
                <Text style={s.tapHintText}>open</Text>
              </View>
            </Pressable>
          </Card>
        </View>

        {/* ---------- next badge ---------- */}
        <Pressable onPress={() => router.push('/activity' as any)}>
          <Card accent={next?.victory ? '#FFC93C' : Colors.primary}>
            <View style={s.badgeHead}>
              <View style={s.badgeIconWrap}>
                <AppIcon name="ribbon-outline" size={20} color={next?.victory ? '#FFC93C' : Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.badgeTitle}>
                  {next ? `${stepsToNext(today.steps).toLocaleString()} steps to ${next.title}` : 'Every badge unlocked 👑'}
                </Text>
                <Text style={s.badgeSub}>
                  {earned}/{STEP_MILESTONES.length} earned {new Set(unlocked).size > earned ? `· ${new Set(unlocked).size} all-time` : ''}
                </Text>
              </View>
              <Text style={s.badgeSteps}>{earned}</Text>
            </View>
            <View style={s.badgeDots}>
              {STEP_MILESTONES.map((m) => {
                const got = milestonesReached(today.steps).some((x) => x.code === m.code);
                return (
                  <View
                    key={m.code}
                    style={[
                      s.dot,
                      got && { backgroundColor: m.victory ? '#FFC93C' : Colors.primary, borderColor: m.victory ? '#FFC93C' : Colors.primary },
                    ]}
                  />
                );
              })}
            </View>
            <Text style={s.badgeMsg}>{stepsMessage(today.steps, stepGoal)}</Text>
          </Card>
        </Pressable>

        {/* ---------- quick log ---------- */}
        <SectionTitle title="Log it fast" icon="color-wand-outline" />
        <View style={s.chipRow}>
          {[500, 1000, 2000, 5000].map((n) => (
            <BouncyPress
              key={n}
              onPress={() => quick(() => addSteps(n), `+${n.toLocaleString()} steps`)}
              disabled={busy}
              scaleTo={0.9}
              accessibilityLabel={`Add ${n} steps`}
              style={s.pill}
            >
              <AppIcon name="add" size={14} color={Colors.primary} />
              <Text style={s.pillText}>{n >= 1000 ? `${n / 1000}k` : n} steps</Text>
            </BouncyPress>
          ))}
        </View>
        <View style={s.chipRow}>
          {[200, 300, 500].map((ml) => (
            <BouncyPress
              key={ml}
              onPress={() => quick(() => addWater(ml), `+${ml} ml 💧`)}
              disabled={busy}
              scaleTo={0.9}
              accessibilityLabel={`Add ${ml} millilitres of water`}
              style={[s.pill, { borderColor: Colors.accent }]}
            >
              <AppIcon name="water-outline" size={14} color={Colors.accent} />
              <Text style={[s.pillText, { color: Colors.accent }]}>{ml} ml</Text>
            </BouncyPress>
          ))}
        </View>

        {/* ---------- four big buttons ---------- */}
        <SectionTitle title="What are you doing?" icon="apps-outline" />
        <ButtonGrid>
          <BigActionButton
            style={s.half}
            title="Train"
            hint="Strength · Yoga · Cardio · Mobility"
            icon="layers-outline"
            onPress={() => router.push('/train' as any)}
            badge="ALL"
          />
          <BigActionButton
            style={s.half}
            title="Log Food"
            hint="Meals, calories and macros"
            icon="restaurant-outline"
            color={Colors.accent}
            onPress={() => router.push('/nutrition/logger' as any)}
          />
          <BigActionButton
            style={s.half}
            title="Steps"
            hint="Counter and badge map"
            icon="footsteps-outline"
            onPress={() => router.push('/activity/steps' as any)}
          />
          <BigActionButton
            style={s.half}
            title="Run"
            hint="Timer, pace and calories"
            icon="run-outline"
            color="#F472B6"
            onPress={() => router.push('/activity/run' as any)}
          />
        </ButtonGrid>

        {/* ---------- move of the day ---------- */}
        <SectionTitle title="Move of the day" icon="barbell-outline" />
        <Pressable style={s.moveCard} onPress={() => router.push(`/workouts/${move.id}` as any)}>
          <ExerciseGallery exerciseId={move.id} muscle={move.muscle_group} heroHeight={180} />
          <View style={s.moveBar}>
            <View style={{ flex: 1 }}>
              <Text style={s.moveKick}>TODAY'S PICK</Text>
              <Text style={s.moveName}>{move.name}</Text>
              <Text style={s.moveMeta}>{move.reps} · {move.sets} sets · {move.rest_sec}s rest</Text>
            </View>
            <AppIcon name="chevron-forward" size={20} color={Colors.muted} />
          </View>
        </Pressable>

        {/* ---------- nutrition target ---------- */}
        <Card>
          <View style={s.nutHead}>
            <View style={{ flex: 1 }}>
              <Text style={s.nutTitle}>{cal.toLocaleString()} kcal</Text>
              <Text style={s.nutSub}>{pro} g protein target</Text>
            </View>
            <SmallEdit onPress={openEditor} />
          </View>
          {editing ? (
            <>
              <Field label="Calories target (kcal)" value={fCal} onChangeText={setFCal} placeholder="e.g. 2200" keyboardType="numeric" />
              <Field label="Protein target (g)" value={fPro} onChangeText={setFPro} placeholder="e.g. 120" keyboardType="numeric" />
              <PrimaryButton title="Save targets" icon="checkmark" onPress={saveTargets} />
              <GhostButton title="Cancel" onPress={() => setEditing(false)} />
            </>
          ) : (
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              <Chip label={custom ? 'Your targets' : 'Estimated targets'} icon="speedometer-outline" color={custom ? Colors.primary : Colors.muted} />
              {custom ? <Chip label="Reset" icon="refresh-outline" color={Colors.muted} /> : null}
            </View>
          )}
        </Card>

        {/* ---------- today summary ---------- */}
        <SectionTitle title="Done today" icon="checkmark-circle-outline" right={`${summary?.totalDone ?? 0} checkmarks`} />
        <Card>
          <Body>⚖️ {summary?.weightKg != null ? `${summary.weightKg} kg` : '— weight'}</Body>
          <Body>
            🧘{' '}
            {summary && summary.yogas.length
              ? summary.yogas.map((y) => `${y.name} × ${y.times}`).join(' • ')
              : 'no yoga yet'}
          </Body>
          <Body>
            💪{' '}
            {summary && summary.workouts.length
              ? summary.workouts.map((w) => `${w.name} × ${w.times}`).join(' • ')
              : 'no training yet'}
          </Body>
          {today.runKm > 0 ? <Body>🏃 {today.runKm} km run · {today.runMin} min</Body> : null}
          <ActionCard
            title="Share my day"
            desc="Weight, yoga and training"
            icon="share-social-outline"
            onPress={() => router.push('/progress/share' as any)}
          />
        </Card>

        {/* ---------- secondary stuff, collapsed ---------- */}
        <PrimaryButton
          title={moreOpen ? 'Hide extra options' : 'More options'}
          icon={moreOpen ? 'close' : 'layers-outline'}
          onPress={() => setMoreOpen((v) => !v)}
        />
        {moreOpen ? (
          <Card>
            <ActionCard title="Progress & charts" desc="Weight, activity, measurements" icon="stats-chart-outline" onPress={() => router.push('/progress/weight' as any)} />
            <ActionCard title="Achievement map" desc="All seven step badges" icon="map-outline" onPress={() => router.push('/activity' as any)} />
            <ActionCard title="Water & hydration" desc="Bottles, target, tips" icon="water-outline" accent={Colors.accent} onPress={() => router.push('/activity/water' as any)} />
            <ActionCard title="Yoga library" desc="Sessions and pose library" icon="body-outline" accent="#2DD4BF" onPress={() => router.push('/yoga' as any)} />
            <ActionCard title="Recovery" desc="Sleep, stretching, rest days" icon="heart-outline" accent="#F472B6" onPress={() => router.push('/nutrition/recovery' as any)} />
            <ActionCard title="Habits" desc="Daily streak board" icon="checkmark-circle-outline" onPress={() => router.push('/progress/habits' as any)} />
            <ActionCard title="Nutrition plan" desc="Meals, groceries, recipes" icon="leaf-outline" accent={Colors.accent} onPress={() => router.push('/nutrition/plan' as any)} />
            <ActionCard title="Add your own content" desc="Exercise, yoga flow or food" icon="add-circle-outline" onPress={() => router.push('/workouts/add' as any)} />
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              <Muted>Trained legs yesterday? Upper body, yoga or recovery today.</Muted>
            </View>
          </Card>
        ) : null}

        <DisclaimerBanner text={SPOT_REDUCTION_NOTE} />
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

function SmallEdit({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={s.editBtn}>
      <AppIcon name="color-wand-outline" size={15} color={Colors.primary} />
      <Text style={s.editText}>Edit</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  ringRow: { flexDirection: 'row', marginHorizontal: -4 },
  ringCard: { flex: 1, marginHorizontal: 4, paddingVertical: 16, paddingHorizontal: 6 },
  half: cell(2),
  ringVal: { color: Colors.text, fontWeight: '900', fontSize: 20, marginTop: 2 },
  ringLab: { color: Colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  ringPct: { color: Colors.muted, fontSize: 11, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  tapHint: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  tapHintText: { color: Colors.muted, fontSize: 9, fontWeight: '700' },

  badgeHead: { flexDirection: 'row', alignItems: 'center' },
  badgeIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.raised, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  badgeTitle: { color: Colors.text, fontWeight: '900', fontSize: 15 },
  badgeSub: { color: Colors.muted, fontSize: 11, fontWeight: '700', marginTop: 1 },
  badgeSteps: { color: Colors.primary, fontWeight: '900', fontSize: 26 },
  badgeDots: { flexDirection: 'row', marginTop: 12 },
  dot: { flex: 1, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.border, marginHorizontal: 2, backgroundColor: 'transparent' },
  badgeMsg: { color: Colors.muted, fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  chipRow: gridRow(),
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySoft, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 13, margin: 4 },
  pillText: { color: Colors.primary, fontWeight: '900', fontSize: 13, marginLeft: 5 },

  moveCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 4 },
  moveBar: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  moveKick: { color: Colors.primary, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  moveName: { color: Colors.text, fontWeight: '900', fontSize: 16, marginTop: 2 },
  moveMeta: { color: Colors.muted, fontSize: 12, fontWeight: '600', marginTop: 1 },

  nutHead: { flexDirection: 'row', alignItems: 'center' },
  nutTitle: { color: Colors.text, fontWeight: '900', fontSize: 24 },
  nutSub: { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySoft, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  editText: { color: Colors.primary, fontWeight: '800', fontSize: 12, marginLeft: 4 },
});