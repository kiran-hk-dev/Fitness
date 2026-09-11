import { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {Card, H1, Body, Muted, EmptyState, IconButton, BottomSpace, ActionCard, TopSpace, ErrorCard} from '../../src/components/ui';
import { getLogsForDate, todayKey } from '../../src/lib/tracking';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function YogaHistory() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    setLoadError('');
    try {
      const logs = await getLogsForDate(todayKey());
      setRows(logs.filter((l) => l.kind === 'yoga'));
    } catch (e: any) {
      setRows([]);
      setLoadError(e?.message ?? 'Could not load yoga history.');
    } finally { setRefreshing(false); }
  }, []);

  // count repeats => "times done today"
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.item_name, (counts.get(r.item_name) ?? 0) + 1);

  const removeCheck = async (rowId: string) => {
    const { error } = await supabase.from('training_logs').delete().eq('id', rowId);
    if (error) return toast(error.message, 'error');
    load();
  };

  return (
    <View style={{ flex: 1 }}><ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <TopSpace />
      <H1>Yoga History ✓</H1>
      <Muted>Pull to refresh. Every ✓ checkmark is stored in Supabase training_logs under your account.</Muted>
      {loadError && rows.length === 0 ? (
        <ErrorCard message={loadError} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState title="No yoga checkmarks today" hint="Start a session and tap ✓ per pose." />
      ) : (
        <>
          {[...counts.entries()].map(([name, times]) => (
            <Card key={name}><Body>✓ {name} — × {times} time{times > 1 ? 's' : ''} today</Body></Card>
          ))}
          {rows.map((r) => (
            <Card key={r.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Body>✓ {r.item_name}</Body>
                <View style={{ flex: 1 }} />
                <IconButton icon="close" onPress={() => removeCheck(r.id)} />
              </View>
            </Card>
          ))}
        </>
      )}
      <ActionCard title="View + share today" desc="Weight + yoga × times" icon="share-social-outline" onPress={() => router.push('/progress/share' as any)} />
      <ActionCard title="Back to yoga" icon="body-outline" onPress={() => router.push('/yoga' as any)} />
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
