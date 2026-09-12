import { useEffect, useState, useCallback } from 'react';
import { ScrollView, Alert, View, Pressable } from 'react-native';
import { Card, H1, Body, Muted, PrimaryButton, BottomSpace, SectionTitle, EmptyState, SearchInput, DataRow, IconButton, SmallButton, Chip } from '../../src/components/ui';
import { FoodPhoto } from '../../src/components/FoodArt';
import { FOODS } from '../../src/data/foods';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

export default function Logger() {
  const [meal, setMeal] = useState('lunch');
  const [q, setQ] = useState('');
  const [tray, setTray] = useState<Record<string, number>>({});
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const trayItems = Object.entries(tray)
    .map(([id, qty]) => ({ food: FOODS.find((f) => f.id === id)!, qty }))
    .filter((r) => r.food && r.qty > 0);
  const itemCount = trayItems.reduce((a, r) => a + r.qty, 0);
  const total = trayItems.reduce((a, r) => a + r.food.calories * r.qty, 0);
  const protein = Math.round(trayItems.reduce((a, r) => a + r.food.protein_g * r.qty, 0));
  const carbs = Math.round(trayItems.reduce((a, r) => a + r.food.carbs_g * r.qty, 0));
  const fat = Math.round(trayItems.reduce((a, r) => a + r.food.fat_g * r.qty, 0));
  const addToTray = (id: string) => setTray((t) => ({ ...t, [id]: (t[id] ?? 0) + 1 }));
  const decTray = (id: string) =>
    setTray((t) => {
      const q = (t[id] ?? 0) - 1;
      const n = { ...t };
      if (q <= 0) delete n[id];
      else n[id] = q;
      return n;
    });
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
    if (!trayItems.length) {
      toast('Tray is empty — add foods first', 'error');
      return;
    }
    setBusy(true);
    // The items table has a foreign key to foods(id): make sure every tray
    // food exists as a Supabase row first (no-op if seed.sql was already run).
    const { error: foodErr } = await supabase.from('foods').upsert(
      trayItems.map(({ food: f }) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        serving_size: f.serving,
        calories: f.calories,
        protein_g: f.protein_g,
        carbs_g: f.carbs_g,
        fat_g: f.fat_g,
        fiber_g: f.fiber_g,
        sugar_g: f.sugar_g,
        published: true,
      })),
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (foodErr) {
      setBusy(false);
      toast(foodErr.message, 'error');
      return;
    }
    const { data: log, error } = await supabase
      .from('meal_logs')
      .insert({ user_id: user.id, meal_type: meal, total_calories: total })
      .select('id')
      .single();
    if (error || !log) {
      setBusy(false);
      toast(error?.message ?? 'Save failed', 'error');
      return;
    }
    const { error: itemsError } = await supabase.from('meal_log_items').insert(
      trayItems.map(({ food: f, qty }) => ({
        meal_log_id: log.id,
        food_id: f.id,
        quantity: qty,
        calculated_nutrition_json: {
          calories: f.calories * qty,
          protein_g: Math.round(f.protein_g * qty * 10) / 10,
          carbs_g: Math.round(f.carbs_g * qty * 10) / 10,
          fat_g: Math.round(f.fat_g * qty * 10) / 10,
        },
      }))
    );
    setBusy(false);
    if (itemsError) {
      toast(itemsError.message, 'error');
      return;
    }
    setTray({});
    toast(`Saved ✓ — ${meal} (${itemCount} items, ${total} kcal) logged`);
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 }}>
        {['breakfast', 'lunch', 'dinner', 'snack'].map((m) => (
          <Pressable key={m} onPress={() => setMeal(m)}>
            <View style={{ marginRight: 4 }}>
              <Chip label={m} color={meal === m ? Colors.primary : Colors.faint} />
            </View>
          </Pressable>
        ))}
      </View>
      <Card accent={Colors.primary}>
        <SectionTitle title={`${meal} tray`} icon="basket-outline" right={`${itemCount} items · ${total} kcal`} />
        {trayItems.length === 0 ? (
          <Muted>Empty — tap + Add on foods below. Items and counts appear here instantly.</Muted>
        ) : (
          <>
            {trayItems.map(({ food: f, qty }) => (
              <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
                <FoodPhoto foodId={f.id} category={f.category} size={40} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Body>{f.name}</Body>
                  <Muted>{f.calories} kcal each • P{f.protein_g}g</Muted>
                </View>
                <SmallButton title="−" onPress={() => decTray(f.id)} />
                <Body> × {qty} = {f.calories * qty} kcal </Body>
                <SmallButton title="+" onPress={() => addToTray(f.id)} />
              </View>
            ))}
            <Muted>Total: {total} kcal • P{protein}g C{carbs}g F{fat}g</Muted>
            <SmallButton title="Clear tray" tone="ghost" onPress={() => setTray({})} />
          </>
        )}
      </Card>

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
          <SmallButton title="Add" icon="add" onPress={() => addToTray(f.id)} />
          {tray[f.id] ? <Muted>× {tray[f.id]} in tray ✓</Muted> : null}
        </Card>
      ))}
      <PrimaryButton title={`Save ${meal} log (${total} kcal)`} loading={busy} onPress={save} />
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
