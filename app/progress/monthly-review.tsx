import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import {Card, H1, Body, Muted, BottomSpace, SectionTitle, EmptyState, TopSpace} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors, gridRow, cell } from '../../src/theme';

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={useStyles().stat}>
      <Text style={[useStyles().statVal, { color: color ?? Colors.text }]}>{value}</Text>
      <Text style={useStyles().statLab}>{label}</Text>
    </View>
  );
}

export default function MonthlyReview() {
  const [s, setS] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [sessions, logs, meals, water, metrics] = await Promise.all([
        supabase.from('workout_sessions').select('id,started_at').eq('user_id', user.id).gte('started_at', since),
        supabase.from('training_logs').select('log_date,kind').eq('user_id', user.id).eq('completed', true).gte('log_date', since.slice(0, 10)),
        supabase.from('meal_logs').select('id').eq('user_id', user.id).gte('logged_at', since),
        supabase.from('water_logs').select('id').eq('user_id', user.id).gte('logged_at', since),
        supabase.from('body_metrics').select('weight_kg,logged_at').eq('user_id', user.id).gte('logged_at', since).order('logged_at'),
      ]);
      const t = (logs.data ?? []) as any[];
      const w = t.filter((r) => r.kind === 'workout').length;
      const y = t.filter((r) => r.kind === 'yoga').length;
      const days = new Set(t.map((r) => r.log_date)).size;
      const m = (metrics.data ?? []) as any[];
      const wDelta = m.length > 1 ? Number(m[m.length - 1].weight_kg) - Number(m[0].weight_kg) : null;
      setS({
        sessions: sessions.data?.length ?? 0,
        workouts: w, yogas: y, activeDays: days,
        meals: meals.data?.length ?? 0, water: water.data?.length ?? 0,
        wDelta,
      });
    })();
  }, []);

  if (!s) {
    return (
      <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
        <H1>Monthly Review 📊</H1>
        <EmptyState title="Log in to see your review" hint="Your last-30-days stats appear here." icon="calendar-outline" />
        <BottomSpace />
      </ScrollView><BottomNav /></View>
    );
  }

  const improved: string[] = [];
  const stalled: string[] = [];
  if (s.activeDays >= 12) improved.push(`Active ${s.activeDays} days — great consistency`);
  else stalled.push(`Only ${s.activeDays} active days — aim for 12+ next month`);
  if (s.workouts + s.yogas >= 20) improved.push(`${s.workouts + s.yogas} checkmarks logged`);
  else stalled.push('Few checkmarks — even a 15-min walk counts');
  if (s.meals >= 20) improved.push('Meal logging is steady');
  else stalled.push('Meal logging is sparse — log just dinners to start');
  if (s.wDelta != null && Math.abs(s.wDelta) < 0.2) stalled.push('Weight flat — review portions + steps');
  if (s.wDelta != null && Math.abs(s.wDelta) >= 0.2) improved.push(`Weight ${s.wDelta > 0 ? '+' : ''}${s.wDelta.toFixed(1)} kg vs 30 days ago`);

  const STATS = [
    { label: 'Workouts', value: String(s.sessions), color: Colors.primary },
    { label: 'Yoga', value: String(s.yogas), color: '#2DD4BF' },
    { label: 'Active days', value: String(s.activeDays), color: '#38BDF8' },
    { label: 'Meals', value: String(s.meals), color: '#EAB308' },
    { label: 'Water logs', value: String(s.water), color: '#38BDF8' },
    {
      label: 'kg / 30d',
      value: s.wDelta == null ? '—' : `${s.wDelta > 0 ? '+' : ''}${s.wDelta.toFixed(1)}`,
      color: '#F472B6',
    },
  ];

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <H1>Monthly Review 📊</H1>
      <Muted>Last 30 days, computed from your logs.</Muted>
      <View style={[gridRow(), { marginVertical: 6 }]}>
        {STATS.map((st) => (
          // Wrapper carries the gutter so the stat boxes have real space
          // between them instead of sitting flush against each other.
          <View key={st.label} style={cell(3)}>
            <Stat value={st.value} label={st.label} color={st.color} />
          </View>
        ))}
      </View>
      <SectionTitle title="What improved ✅" icon="trending-up-outline" />
      {improved.length === 0 ? <Card><Body>Nothing yet — your first wins will show here.</Body></Card> : null}
      {improved.map((t) => <Card key={t} accent={Colors.primary}><Body>{t}</Body></Card>)}
      <SectionTitle title="What stalled ⏸" icon="pause-circle-outline" />
      {stalled.length === 0 ? <Card><Body>Nothing stalling. Keep going! 🎉</Body></Card> : null}
      {stalled.map((t) => <Card key={t} accent="#F59E0B"><Body>{t}</Body></Card>)}
      <Card><Body>🌱 Next change: pick ONE — +1 workout/week, protein at lunch, or 30 min earlier bedtime. Reassess in 4 weeks; never auto-jump to advanced.</Body></Card>
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  // No width/gutter: the grid wrapper owns the cell so the boxes have space
  // between them and the row fills the screen width exactly.
  stat: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', height: 68, justifyContent: 'center' },
  statVal: { fontWeight: '800', fontSize: 18 },
  statLab: { color: Colors.muted, fontSize: 10.5, marginTop: 2, textAlign: 'center' },
});
