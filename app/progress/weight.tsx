import { useEffect, useState } from 'react';
import { ScrollView, Alert, View } from 'react-native';
import { Card, H1, Body, Muted, PrimaryButton, BottomSpace, SectionTitle, EmptyState, Field, DataRow, IconButton } from '../../src/components/ui';
import { WeightChart } from '../../src/components/Charts';
import { supabase } from '../../src/lib/supabase';
import { saveWeightHeight } from '../../src/lib/tracking';
import { toast } from '../../src/components/Toast';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function Weight() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('body_metrics')
      .select('*').eq('user_id', user.id)
      .order('logged_at', { ascending: false }).limit(14);
    setHistory(data ?? []);
    const { data: p } = await supabase.from('profiles').select('weight_kg,height_cm').eq('id', user.id).single();
    if (p) {
      if (p.weight_kg) setWeight(String(p.weight_kg));
      if (p.height_cm) setHeight(String(p.height_cm));
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const w = Number(weight), h = Number(height);
    if (weight && !(w > 20 && w < 400)) return setErr('Weight must be 20–400 kg.');
    if (height && !(h > 50 && h < 300)) return setErr('Height must be 50–300 cm.');
    setErr('');
    setSaving(true);
    try {
      // Stored in Supabase: profiles (current) + body_metrics (history)
      await saveWeightHeight({ weightKg: weight ? w : null, heightCm: height ? h : null });
      toast('Saved ✓ — added to your history');
      load();
    } catch (e: any) {
      setErr(e?.message ?? 'Save failed — try again.');
    } finally { setSaving(false); }
  };

  const remove = async (rowId: string) => {
    Alert.alert('Delete entry?', 'This removes it from your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('body_metrics').delete().eq('id', rowId);
          if (error) return toast(error.message, 'error');
          toast('Entry deleted');
          load();
        },
      },
    ]);
  };

  const avg7 = history.length
    ? (history.slice(0, 7).reduce((a, r) => a + (Number(r.weight_kg) || 0), 0) / Math.min(7, history.length)).toFixed(1)
    : '—';
  const chrono = [...history].reverse();

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <H1>Weight + Height ⚖️</H1>
      <Muted>Stored per account in Supabase (profiles + body_metrics). Judge the 7-day average, not single days.</Muted>

      {chrono.length > 1 ? (
        <Card>
          <SectionTitle title="Trend" icon="trending-up-outline" right={`${chrono.length} entries`} />
          <WeightChart
            labels={chrono.map((r) => new Date(r.logged_at).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' }))}
            values={chrono.map((r) => Number(r.weight_kg) || 0)}
          />
        </Card>
      ) : (
        <EmptyState title="Log twice to see your graph" hint="Your trend line appears here." icon="trending-up-outline" />
      )}

      <Card>
        <Field label="Weight (kg)" value={weight} onChangeText={(t) => { setWeight(t); setErr(''); }} placeholder="e.g. 72.5" keyboardType="numeric" />
        <Field label="Height (cm)" value={height} onChangeText={(t) => { setHeight(t); setErr(''); }} placeholder="e.g. 172" keyboardType="numeric" error={err} />
        <PrimaryButton title="Save to my account ✓" loading={saving} onPress={save} />
      </Card>
      <Card><Body>7-day average: {avg7} kg</Body></Card>
      <SectionTitle title="History" icon="time-outline" right={`${history.length}`} />
      {history.length === 0 ? <EmptyState title="No entries yet" hint="Save your first log above." icon="scale-outline" /> : null}
      {history.length > 0 ? (
        <Card>
          {history.map((r) => (
            <DataRow
              key={r.id}
              label={new Date(r.logged_at).toLocaleDateString()}
              value={`${r.weight_kg ?? '—'} kg`}
              sub={r.height_cm ? `${r.height_cm} cm` : undefined}
              action={<IconButton icon="trash" tone="danger" onPress={() => remove(r.id)} />}
            />
          ))}
        </Card>
      ) : null}
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
