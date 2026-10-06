import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PageHeader, Card, Body, Muted, PrimaryButton, GhostButton, PickButton, PickRow,
  BottomSpace, TopSpace, SectionTitle, DisclaimerBanner, DataRow,
} from '../../src/components/ui';
import { CountUp, AnimatedBar } from '../../src/components/ActivityVisuals';
import { AppIcon } from '../../src/components/AppIcon';
import { useActivity } from '../../src/hooks/useActivity';
import { fetchRunsForRange, deleteRun, saveRun, type RunEntry } from '../../src/lib/activity';
import { runStats, formatPace, formatDuration } from '../../src/utils/steps';
import { toast } from '../../src/components/Toast';
import { Colors, gridRow } from '../../src/theme';
import type { AppIconName } from '../../src/components/AppIcon';

const WEEK_GOAL_KM = 15;

function clock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function RunScreen() {
  const router = useRouter();
  const { today, refresh } = useActivity();

  // live stopwatch state
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // manual entry
  const [dist, setDist] = useState('');
  const [mins, setMins] = useState('');
  const [busy, setBusy] = useState(false);
  const [week, setWeek] = useState<RunEntry[]>([]);

  useEffect(() => {
    fetchRunsForRange(7).then(setWeek).catch(() => {});
  }, [today.runKm]);

  useEffect(() => {
    if (running) {
      tick.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running]);

  const liveMin = elapsed / 60;
  const manual = runStats(Number(dist) || 0, Number(mins) || 0);

  const toggleTimer = () => {
    if (running) {
      setRunning(false);
      if (elapsed < 5) return toast('Run for at least a few seconds', 'error');
      setMins(String(Math.max(1, Math.round(elapsed / 60))));
      toast(`Stopped at ${formatDuration(liveMin)} — add a distance and save`);
    } else {
      setElapsed(0);
      setRunning(true);
    }
  };

  const save = async (d: number, m: number) => {
    if (busy) return;
    if (!(d > 0) && !(m > 0)) return toast('Add a distance or a time first', 'error');
    setBusy(true);
    try {
      const res = await saveRun({ distanceKm: d, durationMin: m });
      toast(`Run saved — ${res.distanceKm} km · ${res.calories} kcal`);
      setDist('');
      setMins('');
      setElapsed(0);
      setRunning(false);
      await refresh();
      setWeek(await fetchRunsForRange(7));
    } catch (e: any) {
      toast(e?.message ?? 'Could not save the run', 'error');
    } finally {
      setBusy(false);
    }
  };

  const weekKm = week.reduce((s, r) => s + r.distanceKm, 0);
  const weekMin = week.reduce((s, r) => s + r.durationMin, 0);
  const weekPct = Math.min(1, weekKm / WEEK_GOAL_KM);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={Colors.primary} />}>
        <TopSpace height={44} />
        <Pressable style={s.back} onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="chevron-forward" size={20} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <PageHeader title="Running" subtitle="Log a run and see pace" icon="run-outline" />

        {/* Live timer */}
        <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
          <View style={s.timerRow}>
            <AppIcon name={running ? 'stopwatch-outline' : 'timer-outline'} size={20} color={running ? Colors.primary : Colors.muted} />
            <Text style={s.timerLabel}>{running ? 'Running now' : 'Stopwatch'}</Text>
          </View>
          <Text style={s.clock}>{clock(elapsed)}</Text>
          <Pressable
            onPress={toggleTimer}
            style={({ pressed }) => [s.timerBtn, { backgroundColor: running ? Colors.danger : Colors.primary }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <AppIcon name={running ? 'close' : 'play'} size={20} color={running ? '#FFFFFF' : Colors.onPrimary} />
            <Text style={[s.timerBtnText, { color: running ? '#FFFFFF' : Colors.onPrimary }]}>
              {running ? 'Stop' : elapsed > 0 ? 'Restart' : 'Start running'}
            </Text>
          </Pressable>
          {running ? <Text style={s.timerHint}>Distance is typed in after you stop.</Text> : null}
        </Card>

        {/* Today */}
        <Card>
          <View style={s.todayRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.todayNum}><CountUp to={today.runKm} style={{ color: Colors.text, fontWeight: '900', fontSize: 30 }} /> km</Text>
              <Muted>today · {formatDuration(today.runMin)} · {today.runCalories} kcal</Muted>
            </View>
            <AppIcon name="flame-outline" size={40} color={Colors.primary} />
          </View>
          {today.runKm > 0 ? (
            <GhostButton title="Log steps from this run" icon="footsteps-outline" onPress={() => router.push('/activity/steps' as any)} />
          ) : null}
        </Card>

        <SectionTitle title="Save a run" icon="receipt-outline" />
        <Card accent={Colors.primary}>
          <View style={s.inputRow}>
            <View style={s.field}>
              <Text style={s.label}>Distance (km)</Text>
              <TextInput
                value={dist}
                onChangeText={setDist}
                placeholder="5.0"
                placeholderTextColor={Colors.muted}
                keyboardType="decimal-pad"
                style={s.input}
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Time (min)</Text>
              <TextInput
                value={mins}
                onChangeText={setMins}
                placeholder="30"
                placeholderTextColor={Colors.muted}
                keyboardType="number-pad"
                style={s.input}
              />
            </View>
          </View>

          {(Number(dist) > 0 || Number(mins) > 0) ? (
            <View style={s.liveStats}>
              <View style={s.liveStat}><Text style={s.liveVal}>{formatPace(manual.paceMinPerKm)}</Text><Text style={s.liveLab}>pace /km</Text></View>
              <View style={s.liveStat}><Text style={s.liveVal}>{manual.speedKmh || '—'}</Text><Text style={s.liveLab}>km/h</Text></View>
              <View style={s.liveStat}><Text style={s.liveVal}>{manual.calories}</Text><Text style={s.liveLab}>kcal</Text></View>
            </View>
          ) : null}

          <PrimaryButton title="Save this run" icon="checkmark" loading={busy} onPress={() => save(Number(dist) || 0, Number(mins) || 0)} />
          <PickRow style={{ marginTop: 4 }}>
            {[1, 5, 10].map((km) => (
              <PickButton key={km} label={`${km} km`} onPress={() => setDist(String(km))} />
            ))}
          </PickRow>
        </Card>

        <SectionTitle title="This week" icon="bar-chart-outline" right={`goal ${WEEK_GOAL_KM} km`} />
        <Card>
          <View style={s.tierHead}>
            <Text style={s.tierTitle}>{weekKm.toFixed(1)} km · {formatDuration(weekMin)}</Text>
            <Text style={s.tierNum}>{week.length} runs</Text>
          </View>
          <AnimatedBar value={weekPct} color={Colors.primary} height={14} />
          <Muted>{weekPct >= 1 ? 'Weekly distance goal smashed 🎉' : `${(WEEK_GOAL_KM - weekKm).toFixed(1)} km to your weekly goal.`}</Muted>
          {week.length ? (
            <View style={{ marginTop: 8 }}>
              {week.map((r) => (
                <DataRow
                  key={r.id ?? `${r.date}-${r.distanceKm}`}
                  label={`${r.distanceKm} km`}
                  value={`${formatPace(r.durationMin / (r.distanceKm || 1))} /km`}
                  sub={`${r.date} · ${formatDuration(r.durationMin)} · ${r.calories} kcal`}
                  action={
                    <Pressable hitSlop={8} onPress={async () => {
                      await deleteRun(r);
                      toast('Run removed');
                      await refresh();
                      setWeek(await fetchRunsForRange(7));
                    }}>
                      <AppIcon name="trash-outline" size={18} color={Colors.danger} />
                    </Pressable>
                  }
                />
              ))}
            </View>
          ) : (
            <Muted>No runs logged this week yet.</Muted>
          )}
        </Card>

        <SectionTitle title="Other cardio" icon="heart-outline" />
        <PickRow>
          {([
            { label: 'Walk', icon: 'walk-outline', route: '/activity/steps' },
            { label: 'Cycle', icon: 'bicycle-outline', route: '/workouts/plans' },
            { label: 'Mobility', icon: 'body-outline', route: '/yoga' },
          ] as { label: string; icon: AppIconName; route: string }[]).map((c) => (
            <PickButton key={c.label} label={c.label} icon={c.icon} onPress={() => router.push(c.route as any)} />
          ))}
        </PickRow>

        <DisclaimerBanner text="Calorie estimates use ~8.3 MET for running and your logged weight — treat them as a rough guide. Build distance slowly: increase by no more than 10% per week." />
        <BottomSpace />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: { color: Colors.text, fontWeight: '800', fontSize: 15, marginLeft: 2 },
  timerRow: { flexDirection: 'row', alignItems: 'center' },
  timerLabel: { color: Colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 6 },
  clock: { color: Colors.text, fontWeight: '900', fontSize: 52, letterSpacing: 2, fontVariant: ['tabular-nums'], marginVertical: 8 },
  timerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 26, minWidth: 200 },
  timerBtnText: { fontWeight: '900', fontSize: 16, marginLeft: 8 },
  timerHint: { color: Colors.muted, fontSize: 12, marginTop: 10, fontWeight: '600' },
  todayRow: { flexDirection: 'row', alignItems: 'center' },
  todayNum: { color: Colors.text, fontWeight: '900', fontSize: 30 },
  inputRow: gridRow(),
  field: { flex: 1, marginHorizontal: 5 },
  label: { color: Colors.muted, fontSize: 12, fontWeight: '800', marginBottom: 5 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 20, fontWeight: '800', color: Colors.text },
  liveStats: { flexDirection: 'row', marginVertical: 12 },
  liveStat: { flex: 1, alignItems: 'center' },
  liveVal: { color: Colors.primary, fontWeight: '900', fontSize: 20 },
  liveLab: { color: Colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  
  tierHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tierTitle: { color: Colors.text, fontWeight: '800', fontSize: 16 },
  tierNum: { color: Colors.primary, fontWeight: '800', fontSize: 13 },
  
});
