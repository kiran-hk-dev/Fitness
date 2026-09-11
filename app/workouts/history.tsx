import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import {Card, H1, Body, Muted, EmptyState, SmallButton, IconButton, BottomSpace, TopSpace, LoadingView, ErrorCard} from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { getLogsForDate, todayKey } from '../../src/lib/tracking';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function History() {
  const [rows, setRows] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const logs = await getLogsForDate(todayKey());
      setChecks(logs.filter((l) => l.kind === 'workout'));
    } catch { setChecks([]); }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('workout_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20);
      if (error) throw error;
      setRows(data ?? []);
    } catch (e: any) {
      setLoadError(e?.message ?? 'Could not load history.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const removeSession = async (rowId: string) => {
    Alert.alert('Delete session?', 'Its sets delete too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('workout_sessions').delete().eq('id', rowId);
          if (error) return toast(error.message, 'error');
          toast('Session deleted');
          load();
        },
      },
    ]);
  };

  const removeCheck = async (rowId: string) => {
    const { error } = await supabase.from('training_logs').delete().eq('id', rowId);
    if (error) return toast(error.message, 'error');
    load();
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
        <TopSpace />
        <H1>Workout History</H1>
        <LoadingView label="Loading history…" />
        <BottomSpace />
      </ScrollView><BottomNav /></View>
    );
  }

  if (loadError) {
    return (
      <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
        <TopSpace />
        <H1>Workout History</H1>
        <ErrorCard message={loadError} onRetry={load} />
        <BottomSpace />
      </ScrollView><BottomNav /></View>
    );
  }

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Workout History</H1>
      <Card>
        <Body>Today's checkmarks ✓ ({checks.length})</Body>
        {checks.length === 0 ? <Muted>No checkmarks yet — open Active Workout and tap ✓.</Muted> : null}
        {checks.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Body>✓ {c.item_name}</Body>
            <View style={{ flex: 1 }} />
            <IconButton icon="close" onPress={() => removeCheck(c.id)} />
          </View>
        ))}
      </Card>
      {rows.length === 0 ? <EmptyState title="No sessions yet" hint="Start a plan — sessions save to Supabase with RLS." /> : null}
      {rows.map((r) => (
        <Card key={r.id}>
          <Body>{new Date(r.started_at).toLocaleString()} • {r.duration_min ?? '?'} min • effort {r.effort ?? '—'}</Body>
          <Muted>{r.plan_id}</Muted>
          <SmallButton title="Delete" icon="trash-outline" tone="danger" onPress={() => removeSession(r.id)} />
        </Card>
      ))}
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
