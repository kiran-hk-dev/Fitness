import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import {Card, H1, Body, Muted, BottomSpace, SectionTitle, TopSpace} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

const HABITS = [
  { id: 'water', label: '💧 Water' },
  { id: 'sleep', label: '😴 Sleep 7h+' },
  { id: 'steps', label: '👟 Steps' },
  { id: 'meals', label: '🍛 Clean meals' },
  { id: 'workout', label: '💪 Workout' },
  { id: 'no_sugar', label: '🚫 No extra sugar' },
  { id: 'recovery', label: '🧘 Recovery' },
];

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default function Habits() {
  const [todaySet, setTodaySet] = useState<Set<string>>(new Set());
  const [week, setWeek] = useState<Record<string, Set<string>>>({});

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const keys: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(dayKey(d));
    }
    const { data } = await supabase.from('habit_logs').select('habit_type,logged_at')
      .eq('user_id', user.id).gte('logged_at', new Date(keys[0]).toISOString());
    const byDay: Record<string, Set<string>> = {};
    keys.forEach((k) => (byDay[k] = new Set()));
    (data ?? []).forEach((r: any) => {
      const k = new Date(r.logged_at).toISOString().slice(0, 10);
      if (byDay[k]) byDay[k].add(r.habit_type);
    });
    setWeek(byDay);
    setTodaySet(byDay[keys[6]] ?? new Set());
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (habit: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = dayKey(new Date());
    if (todaySet.has(habit)) {
      // untoggle: delete today's row
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      await supabase.from('habit_logs').delete().eq('user_id', user.id)
        .eq('habit_type', habit).gte('logged_at', start.toISOString());
    } else {
      await supabase.from('habit_logs').insert({ user_id: user.id, habit_type: habit, value: 1 });
    }
    load();
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

  const dayLabels = Object.keys(week).sort().map((k) => new Date(k + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' }));

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Habits ✅</H1>
      <Muted>Tap to log today — tap again to undo. No shame, just dots.</Muted>

      <SectionTitle title="Today" icon="today-outline" />
      <View style={useStyles().grid}>
        {HABITS.map((h) => {
          const on = todaySet.has(h.id);
          return (
            <Pressable
              key={h.id}
              onPress={() => toggle(h.id)}
              style={[useStyles().tile, on && { borderColor: Colors.primary, backgroundColor: '#3A2410' }]}
            >
              <Text style={useStyles().tileEmoji}>{on ? '✅' : '○'}</Text>
              <Text style={useStyles().tileText}>{h.label}</Text>
              <Text style={useStyles().streak}>🔥 {streak(h.id)}d</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="This week" icon="calendar-outline" />
      <Card>
        <View style={useStyles().weekHead}>
          <Text style={[useStyles().weekCell, { flex: 2 }]}> </Text>
          {dayLabels.map((d, i) => (
            <Text key={i} style={useStyles().weekCell}>{d}</Text>
          ))}
        </View>
        {HABITS.map((h) => (
          <View key={h.id} style={useStyles().weekRow}>
            <Text style={[useStyles().weekCell, { flex: 2, textAlign: 'left' }]} numberOfLines={1}>{h.label}</Text>
            {Object.keys(week).sort().map((k) => (
              <Text key={k} style={useStyles().weekCell}>{week[k]?.has(h.id) ? '🟠' : '·'}</Text>
            ))}
          </View>
        ))}
      </Card>
      <Card><Body>Tip: streaks count back from today — one dot a day keeps them alive.</Body></Card>
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '31%', backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, alignItems: 'center', margin: '1%' },
  tileEmoji: { fontSize: 20 },
  tileText: { color: Colors.text, fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  streak: { color: Colors.muted, fontSize: 10, marginTop: 2 },
  weekHead: { flexDirection: 'row', marginBottom: 4 },
  weekRow: { flexDirection: 'row', paddingVertical: 5, borderTopWidth: 1, borderTopColor: Colors.border },
  weekCell: { flex: 1, color: Colors.text, fontSize: 12, textAlign: 'center' },
});
