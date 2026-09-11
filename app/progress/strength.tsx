import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {Card, H1, Body, Muted, Chip, BottomSpace, SectionTitle, EmptyState, TopSpace} from '../../src/components/ui';
import { ActivityChart } from '../../src/components/Charts';
import { supabase } from '../../src/lib/supabase';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Strength() {
  const [days, setDays] = useState<{ label: string; total: number; workouts: number; yogas: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const labels: string[] = [];
      const keys: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        keys.push(dayKey(d));
        labels.push(d.toLocaleDateString(undefined, { weekday: 'narrow' }));
      }
      const { data } = await supabase
        .from('training_logs').select('log_date,kind')
        .eq('user_id', user.id).eq('completed', true)
        .gte('log_date', keys[0]).lte('log_date', keys[6]);
      const rows = data ?? [];
      setDays(keys.map((k, i) => ({
        label: labels[i],
        total: rows.filter((r: any) => r.log_date === k).length,
        workouts: rows.filter((r: any) => r.log_date === k && r.kind === 'workout').length,
        yogas: rows.filter((r: any) => r.log_date === k && r.kind === 'yoga').length,
      })));
    })();
  }, []);

  const wTotal = days.reduce((a, d) => a + d.workouts, 0);
  const yTotal = days.reduce((a, d) => a + d.yogas, 0);

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Activity Graph 📊</H1>
      <Muted>Checkmarks per day — last 7 days, from your Supabase logs.</Muted>
      {days.some((d) => d.total > 0) ? (
        <Card>
          <ActivityChart labels={days.map((d) => d.label)} totals={days.map((d) => d.total)} />
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            <Chip label={`💪 ${wTotal} workouts`} color="#38BDF8" />
            <Chip label={`🧘 ${yTotal} yoga`} color="#2DD4BF" />
          </View>
        </Card>
      ) : (
        <EmptyState title="No activity yet" hint="Finish a workout or yoga — your bars appear here." icon="bar-chart-outline" />
      )}
      <Card>
        <SectionTitle title="Today" icon="today-outline" />
        {days.length ? <Body>💪 {days[6].workouts} workouts • 🧘 {days[6].yogas} yoga • ✅ {days[6].total} total</Body> : null}
      </Card>
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
