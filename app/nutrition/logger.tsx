import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Alert, View } from 'react-native';
import { Card, H1, Body, Muted, PrimaryButton, BottomSpace, SectionTitle, EmptyState, SearchInput, DataRow, IconButton, SmallButton } from '../../src/components/ui';
import { FoodPhoto } from '../../src/components/FoodArt';
import { FOODS } from '../../src/data/foods';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function Logger() {
  const [meal, setMeal] = useState('lunch');
  const [q, setQ] = useState('');
  const [total, setTotal] = useState(0);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const list = FOODS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));

  const loadLogs = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase.from('meal_logs').select('*').eq('user_id', user.id)
      .gte('logged_at', dayStart.toISOString()).order('logged_at', { ascending: false });
    setTodayLogs(data ?? []);
  }, []);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast('Log in first — meal logs need an account', 'error');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('meal_logs').insert({ user_id: user.id, meal_type: meal, total_calories: total });
    setBusy(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setTotal(0);
    toast(`Saved ✓ — ${meal} logged`);
    loadLogs();
  };

  const remove = async (rowId: string) => {
    Alert.alert('Delete log?', 'This removes the entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('meal_logs').delete().eq('id', rowId);
          if (error) return toast(error.message, 'error');
          toast('Log deleted');
          loadLogs();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <H1>Log Meal 🍛</H1>
      <Muted>{meal} • running total {total} kcal</Muted>

      <SectionTitle title="Today's logs" icon="receipt-outline" right={`${todayLogs.length}`} />
      {todayLogs.length === 0 ? (
        <EmptyState title="Nothing logged today" hint="Add foods below, then save." icon="restaurant-outline" />
      ) : (
        <Card>
          {todayLogs.map((l) => (
            <DataRow
              key={l.id}
              label={`${l.meal_type} • ${new Date(l.logged_at).toLocaleTimeString()}`}
              value={`${l.total_calories} kcal`}
              action={<IconButton icon="trash" tone="danger" onPress={() => remove(l.id)} />}
            />
          ))}
        </Card>
      )}

      <SectionTitle title="Add foods" icon="add-circle-outline" />
      <SearchInput value={q} onChange={setQ} placeholder="Search idli, rice, paneer…" />
      {list.map((f) => (
        <Card key={f.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FoodPhoto foodId={f.id} category={f.category} size={44} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Body>{f.name} — {f.calories} kcal</Body>
              <Muted>P{f.protein_g}g C{f.carbs_g}g F{f.fat_g}g</Muted>
            </View>
          </View>
          <SmallButton title="+ Add" icon="add" onPress={() => setTotal((t) => t + f.calories)} />
        </Card>
      ))}
      <PrimaryButton title={`Save ${meal} log (${total} kcal)`} loading={busy} onPress={save} />
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
