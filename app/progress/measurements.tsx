import { useEffect, useState } from 'react';
import { ScrollView, Alert, View, Text } from 'react-native';
import { Card, H1, Body, Muted, PrimaryButton, BottomSpace, SectionTitle, EmptyState, Field, DataRow, IconButton } from '../../src/components/ui';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

const FIELDS = [
  { key: 'waist_cm', label: 'Waist (cm)' },
  { key: 'hip_cm', label: 'Hip (cm)' },
  { key: 'chest_cm', label: 'Chest (cm)' },
  { key: 'arm_cm', label: 'Arm (cm)' },
  { key: 'thigh_cm', label: 'Thigh (cm)' },
];

export default function Measurements() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('body_metrics').select('*').eq('user_id', user.id)
      .order('logged_at', { ascending: false }).limit(10);
    setHistory(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const nums: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const v = vals[f.key]?.trim();
      if (!v) { nums[f.key] = null; continue; }
      const n = Number(v);
      if (!(n > 10 && n < 300)) return setErr(`${f.label} should be 10–300.`);
      nums[f.key] = n;
    }
    if (Object.values(nums).every((v) => v == null)) return setErr('Enter at least one measurement.');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setErr('Log in first — measurements need an account.');
      return;
    }
    setErr('');
    setSaving(true);
    // hip_cm needs migration 0006 — retry without it if the column is missing
    let { error } = await supabase.from('body_metrics').insert({ user_id: user.id, ...nums });
    if (error && /hip_cm/i.test(error.message)) {
      const { hip_cm, ...rest } = nums;
      ({ error } = await supabase.from('body_metrics').insert({ user_id: user.id, ...rest }));
    }
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setVals({});
    toast('Measurements saved ✓');
    load();
  };

  const remove = async (rowId: string) => {
    Alert.alert('Delete entry?', 'Removes it from history.', [
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

  const first = history[history.length - 1];
  const latest = history[0];
  const delta = (k: string) => {
    if (!first || !latest || first.id === latest.id) return null;
    const a = Number(first[k]), b = Number(latest[k]);
    if (!a || !b) return null;
    const d = b - a;
    return `${d > 0 ? '+' : ''}${d.toFixed(1)} cm`;
  };

  const fmt = (r: any) =>
    [['Waist', r.waist_cm], ['Hip', r.hip_cm], ['Chest', r.chest_cm], ['Arm', r.arm_cm], ['Thigh', r.thigh_cm]]
      .filter(([, v]) => v != null).map(([l, v]) => `${l} ${v}`).join(' • ') || '—';

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <H1>Measurements 📏</H1>
      <Muted>Optional + private (RLS). Tape at the same spot each time.</Muted>

      {latest && first && latest.id !== first.id ? (
        <Card accent={Colors.primary}>
          <SectionTitle title="Change so far" icon="trending-up-outline" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {FIELDS.map((f) => {
              const d = delta(f.key);
              return d ? (
                <View key={f.key} style={{ backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 8, margin: 3, minWidth: 90, alignItems: 'center' }}>
                  <Text style={{ color: Colors.text, fontWeight: '800', fontSize: 15 }}>{d}</Text>
                  <Text style={{ color: Colors.muted, fontSize: 11 }}>{f.label.replace(' (cm)', '')}</Text>
                </View>
              ) : null;
            })}
          </View>
        </Card>
      ) : null}

      <Card>
        {FIELDS.map((f, i) => (
          <Field
            key={f.key}
            label={f.label}
            value={vals[f.key] ?? ''}
            onChangeText={(v) => { setVals((s) => ({ ...s, [f.key]: v })); setErr(''); }}
            placeholder="cm"
            keyboardType="numeric"
            error={i === FIELDS.length - 1 ? err : undefined}
          />
        ))}
        <PrimaryButton title="Save measurements ✓" loading={saving} onPress={save} />
      </Card>

      <SectionTitle title="History" icon="time-outline" right={`${history.length}`} />
      {history.length === 0 ? (
        <EmptyState title="No entries yet" hint="Log your first set above." icon="body-outline" />
      ) : (
        <Card>
          {history.map((r) => (
            <DataRow
              key={r.id}
              label={new Date(r.logged_at).toLocaleDateString()}
              value=""
              sub={fmt(r)}
              action={<IconButton icon="trash" tone="danger" onPress={() => remove(r.id)} />}
            />
          ))}
        </Card>
      )}
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
