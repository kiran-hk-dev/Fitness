import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Card, H1, Body, Muted, BottomSpace, SectionTitle, TopSpace } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

const HABITS = [
  { id: 'water', label: 'Water', emoji: '💧' },
  { id: 'sleep', label: 'Sleep 7h+', emoji: '😴' },
  { id: 'steps', label: 'Steps', emoji: '👟' },
  { id: 'meals', label: 'Clean meals', emoji: '🍛' },
  { id: 'workout', label: 'Workout', emoji: '💪' },
  { id: 'no_sugar', label: 'No extra sugar', emoji: '🚫' },
  { id: 'recovery', label: 'Recovery', emoji: '🧘' },
];

// Local calendar day (not UTC) so logs land on the day the user sees.
const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Habits() {
  const [todaySet, setTodaySet] = useState<Set<string>>(new Set());
  const [week, setWeek] = useState<Record<string, Set<string>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const keys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(localKey(d));
    }
    const { data, error } = await supabase.from('habit_logs').select('habit_type,logged_at')
      .eq('user_id', user.id).gte('logged_at', new Date(keys[0] + 'T00:00:00').toISOString());
    if (error) {
      toast(error.message, 'error');
      return;
    }
    const byDay: Record<string, Set<string>> = {};
    keys.forEach((k) => (byDay[k] = new Set()));
    (data ?? []).forEach((r: any) => {
      const k = localKey(new Date(r.logged_at));
      if (byDay[k]) byDay[k].add(r.habit_type);
    });
    setWeek(byDay);
    setTodaySet(new Set(byDay[keys[6]] ?? []));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (habit: string) => {
    if (busy) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast('Log in first — habits need an account', 'error');
      return;
    }
    // Instant visual feedback, then sync
    const wasOn = todaySet.has(habit);
    const next = new Set(todaySet);
    if (wasOn) next.delete(habit);
    else next.add(habit);
    setTodaySet(next);
    setBusy(habit);
    try {
      if (wasOn) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const { error } = await supabase.from('habit_logs').delete().eq('user_id', user.id)
          .eq('habit_type', habit).gte('logged_at', start.toISOString());
        if (error) throw error;
      } else {
        const { error } = await supabase.from('habit_logs').insert({ user_id: user.id, habit_type: habit, value: 1 });
        if (error) throw error;
      }
      load();
    } catch (e: any) {
      toast(e?.message ?? 'Could not save', 'error');
      load();
    } finally {
      setBusy(null);
    }
  };

  const streak = (habit: string) => {
    const keys = Object.keys(week).sort().reverse();
    let n = 0;
    for (const k of keys) {
      if (week[k]?.has(habit)) n++;
      else break;
    }
    return n;
  };

  const orderedDays = Object.keys(week).sort();

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Habits ✅</H1>
      <Muted>Tap a tile to log today — tap again to undo.</Muted>

      <SectionTitle title="Today — tap to log" icon="today-outline" />
      <View style={useStyles().grid}>
        {HABITS.map((h) => {
          const on = todaySet.has(h.id);
          const loading = busy === h.id;
          return (
            <Pressable
              key={h.id}
              onPress={() => toggle(h.id)}
              disabled={!!busy}
              style={[
                useStyles().tile,
                on && { borderColor: Colors.primary, borderWidth: 2, backgroundColor: Colors.primarySoft },
                !!busy && !loading && { opacity: 0.6 },
              ]}
            >
              <Text style={useStyles().tileEmoji}>{h.emoji}</Text>
              <Text style={useStyles().tileText}>{h.label}</Text>
              <Text style={[useStyles().tileState, { color: on ? Colors.primary : Colors.muted }]}>
                {loading ? '…' : on ? '✓ Logged' : '○ Tap to log'}
              </Text>
              <Text style={useStyles().streak}>🔥 {streak(h.id)}d streak</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="This week" icon="calendar-outline" />
      <Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: '100%' }}>
            <View style={useStyles().weekHead}>
              <Text style={[useStyles().weekCell, { width: 118, textAlign: 'left' }]}> </Text>
              {orderedDays.map((k) => (
                <Text key={k} style={[useStyles().weekCell, { width: 34 }]}>
                  {new Date(k + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
                </Text>
              ))}
            </View>
            {HABITS.map((h) => (
              <View key={h.id} style={useStyles().weekRow}>
                <Text style={[useStyles().weekCell, { width: 118, textAlign: 'left' }]} numberOfLines={1}>
                  {h.emoji} {h.label}
                </Text>
                {orderedDays.map((k) => (
                  <Text key={k} style={[useStyles().weekCell, { width: 34 }]}>
                    {week[k]?.has(h.id) ? '🟠' : '·'}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </Card>
      <Card><Body>Tip: streaks count back from today — one dot a day keeps them alive.</Body></Card>
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  tile: {
    width: '31.3%', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', margin: '1%',
  },
  tileEmoji: { fontSize: 26 },
  tileText: { color: Colors.text, fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  tileState: { fontSize: 11, fontWeight: '800', marginTop: 4 },
  streak: { color: Colors.muted, fontSize: 10, marginTop: 2 },
  weekHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  weekCell: { color: Colors.text, fontSize: 12, textAlign: 'center' },
});
