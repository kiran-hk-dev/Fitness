import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Card, H1, Body, Muted, BottomSpace, SectionTitle, TopSpace } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors, gridRow, cell } from '../../src/theme';

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
      <View style={gridRow()}>
        {HABITS.map((h) => {
          const on = todaySet.has(h.id);
          const loading = busy === h.id;
          return (
            // Wrapper carries the gutter so the bordered tiles below have real
            // space between them and the row fills the width exactly.
            <View key={h.id} style={cell(3)}>
              <Pressable
                onPress={() => toggle(h.id)}
                disabled={!!busy}
                style={[
                  useStyles().tile,
                  on && { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: Colors.primarySoft },
                  !!busy && !loading && { opacity: 0.6 },
                ]}
              >
                <Text style={useStyles().tileEmoji}>{h.emoji}</Text>
                <Text style={useStyles().tileText} numberOfLines={1}>{h.label}</Text>
                <Text style={[useStyles().tileState, { color: on ? Colors.primary : Colors.muted }]} numberOfLines={1}>
                  {loading ? '…' : on ? '✓ Logged' : '○ Tap to log'}
                </Text>
                <Text style={useStyles().streak}>🔥 {streak(h.id)}d</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <SectionTitle title="This week" icon="calendar-outline" />
      <Card>
        {/* Scrolls horizontally because the label column + 7 day cells are
            wider than a phone; widths are fixed so dots stay under headers. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={useStyles().weekHead}>
              <Text style={[useStyles().weekCell, useStyles().weekLabel]} numberOfLines={1}> </Text>
              {orderedDays.map((k) => (
                <Text key={k} style={[useStyles().weekCell, useStyles().weekDay]} numberOfLines={1}>
                  {new Date(k + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
                </Text>
              ))}
            </View>
            {HABITS.map((h) => (
              <View key={h.id} style={useStyles().weekRow}>
                <Text style={[useStyles().weekCell, useStyles().weekLabel]} numberOfLines={1}>
                  {h.emoji} {h.label}
                </Text>
                {orderedDays.map((k) => (
                  <Text key={k} style={[useStyles().weekCell, useStyles().weekDay]}>
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
  grid: gridRow(),
  // The tile carries no width or gutter: the grid wrapper owns both, so the
  // bordered boxes have real space between them and the row fills the width.
  tile: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: 4,
    alignItems: 'center', height: 116,
  },
  tileEmoji: { fontSize: 22 },
  tileText: { color: Colors.text, fontSize: 11, fontWeight: '700', marginTop: 5, textAlign: 'center' },
  tileState: { fontSize: 10.5, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  streak: { color: Colors.muted, fontSize: 10, marginTop: 3 },
  weekHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  // Label column and day cells share one width so the grid lines up. 118+7*34
  // is wider than a 360pt screen, so the whole grid scrolls horizontally and
  // the cells must stay fixed-width for the dots to align with the headers.
  weekCell: { color: Colors.text, fontSize: 12, textAlign: 'center' },
  weekLabel: { width: 104, textAlign: 'left' },
  weekDay: { width: 32 },
  weekDot: { fontSize: 13 },
});
