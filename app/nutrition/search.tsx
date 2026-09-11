import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { H1, Muted, Chip, SearchInput, ActionCard, TopSpace, IconButton, EmptyState } from '../../src/components/ui';
import { FoodPhoto, foodColor } from '../../src/components/FoodArt';
import { FOODS } from '../../src/data/foods';
import { getSupabaseFoods, deleteOwnFood } from '../../src/lib/diet';
import { supabase } from '../../src/lib/supabase';
import { toast } from '../../src/components/Toast';
import type { Food } from '../../src/types/app';
import { Colors } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';

const CATS = ['all', 'breakfast', 'grains', 'dal', 'protein', 'dairy', 'fruit', 'snack'];

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [custom, setCustom] = useState<(Food & { created_by?: string | null })[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  // Community foods added from the app (Supabase) — merged live, refresh on focus
  const loadCustom = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUid(user?.id ?? null);
      const rows = await getSupabaseFoods();
      setCustom(
        rows
          .filter((r: any) => !FOODS.some((f) => f.id === r.id))
          .map((r: any) => ({
            id: r.id, name: r.name, category: r.category, serving: r.serving_size ?? '1 serving',
            calories: Number(r.calories) || 0, protein_g: Number(r.protein_g) || 0,
            carbs_g: Number(r.carbs_g) || 0, fat_g: Number(r.fat_g) || 0,
            fiber_g: Number(r.fiber_g) || 0, sugar_g: Number(r.sugar_g) || 0,
            created_by: r.created_by ?? null,
          }))
      );
    } catch {}
  }, []);
  useEffect(() => { loadCustom(); }, [loadCustom]);
  useFocusEffect(useCallback(() => { loadCustom(); }, [loadCustom]));

  const removeFood = async (row: Food & { created_by?: string | null }) => {
    Alert.alert('Delete food?', `"${row.name}" will be removed for everyone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteOwnFood(row.id);
            toast('Food deleted');
            loadCustom();
          } catch (e: any) {
            toast(e?.message ?? 'Delete failed', 'error');
          }
        },
      },
    ]);
  };

  const ALL = [...FOODS, ...custom];
  const list = ALL.filter(
    (f) =>
      (f.name + f.category).toLowerCase().includes(q.toLowerCase()) &&
      (cat === 'all' || f.category === cat)
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Diet Items 🍛</H1>
      <Muted>{list.length} foods · yours show a delete button.</Muted>
      <SearchInput value={q} onChange={setQ} placeholder="Search idli, paneer, rice…" />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATS}
        keyExtractor={(c) => c}
        style={{ marginVertical: 4, maxHeight: 46, flexGrow: 0 }}
        renderItem={({ item: c }) => (
          <Pressable onPress={() => setCat(c)}>
            <View style={{ marginRight: 4 }}>
              <Chip label={c} color={cat === c ? (c === 'all' ? Colors.primary : foodColor(c)) : Colors.faint} />
            </View>
          </Pressable>
        )}
      />
      <FlatList
        data={list}
        style={{ flex: 1 }}
        numColumns={2}
        keyExtractor={(f) => f.id}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          q.trim() ? (
            <View style={{ padding: 16 }}>
              <EmptyState title={`No match for "${q.trim()}"`} hint="Add it as a new diet item." icon="search-outline" />
              <ActionCard title={`Add "${q.trim().length > 22 ? q.trim().slice(0, 22) + '…' : q.trim()}"`} desc="Macros + photo" icon="add-circle-outline" onPress={() => router.push(`/nutrition/add-food?name=${encodeURIComponent(q.trim())}` as any)} />
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={{ paddingBottom: 24 }}>
            <ActionCard title="Add new diet item" desc="Macros + photo" icon="add-circle-outline" onPress={() => router.push('/nutrition/add-food' as any)} />
          </View>
        }
        renderItem={({ item: f }) => {
          const mine = !!(f as any).created_by && (f as any).created_by === uid;
          return (
            <View style={[useStyles().gridCard, { borderTopColor: foodColor(f.category), borderTopWidth: 3 }]}>
              <View style={useStyles().photoRow}>
                <FoodPhoto foodId={f.id} category={f.category} size={52} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={useStyles().kcal}>{f.calories}</Text>
                  <Text style={useStyles().kcalUnit}>kcal / {f.serving}</Text>
                </View>
                {mine ? <IconButton icon="trash" tone="danger" onPress={() => removeFood(f as any)} /> : null}
              </View>
              <Text style={useStyles().gridName} numberOfLines={2}>{f.name}</Text>
              <View style={useStyles().macros}>
                <Text style={useStyles().p}>P {f.protein_g}g</Text>
                <Text style={useStyles().c}>C {f.carbs_g}g</Text>
                <Text style={useStyles().fa}>F {f.fat_g}g</Text>
              </View>
              <Text style={useStyles().fiber}>fiber {f.fiber_g}g • sugar {f.sugar_g}g</Text>
            </View>
          );
        }}
      />
      <BottomNav />
    </View>
  );
}

const useStyles = () => StyleSheet.create({
  gridCard: {
    flex: 1, maxWidth: '48.5%', backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.primary, marginVertical: 6, padding: 12, elevation: 2,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  kcal: { color: Colors.text, fontWeight: '800', fontSize: 20 },
  kcalUnit: { color: Colors.muted, fontSize: 10 },
  gridName: { color: Colors.text, fontWeight: '700', fontSize: 13, minHeight: 32 },
  macros: { flexDirection: 'row', marginTop: 6 },
  p: { color: Colors.primary, fontWeight: '800', fontSize: 12, marginRight: 8 },
  c: { color: '#EAB308', fontWeight: '800', fontSize: 12, marginRight: 8 },
  fa: { color: '#FB923C', fontWeight: '800', fontSize: 12 },
  fiber: { color: Colors.muted, fontSize: 10, marginTop: 3 },
});
