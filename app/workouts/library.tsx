import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {H1, Muted, Chip, SearchInput, ActionCard, TopSpace, SmallButton, EmptyState} from '../../src/components/ui';
import { ExercisePhoto } from '../../src/components/ExercisePhoto';
import { EXERCISES, MUSCLE_GROUPS } from '../../src/data/exercises';
import { allPhotoUrls, PHOTO_CREDIT, registerCustomImages } from '../../src/data/exerciseMedia';
import { getSupabaseExercises } from '../../src/lib/diet';
import { getHiddenExercises, clearHiddenExercises } from '../../src/lib/hidden';
import type { Exercise } from '../../src/types/app';
import { MuscleColor, Colors } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';
import { AppIcon } from '../../src/components/AppIcon';

export function ExerciseList() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);

  // Cache all demo photos on-device for offline use
  useEffect(() => {
    Image.prefetch(allPhotoUrls()).catch(() => {});
  }, []);

  // Community exercises added from the app (Supabase) — merged live.
  // Hidden built-ins reload on every focus so deletes/hides apply instantly.
  const [custom, setCustom] = useState<Exercise[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const loadCustom = useCallback(async () => {
    try {
      const rows = await getSupabaseExercises();
      setCustom(
        rows.map((r: any): Exercise => {
          if (r.images_json?.length) registerCustomImages(r.id, r.images_json);
          return {
            id: r.id, name: r.name, muscle_group: r.muscle_group, level: r.level,
            equipment: r.equipment ?? '—', environment: r.environment ?? 'both',
            instructions: r.instructions_json?.length ? r.instructions_json : ['Follow the demo photos step by step'],
            reps: '10-12', sets: 3, rest_sec: 60, breathing: 'Steady breathing', tempo: 'controlled',
            mistakes: [], contraindications: '', regression: 'Easier version', progression: 'Harder version',
            media_url: null, thumbnail_url: null, tags: ['community'],
          };
        })
      );
    } catch {}
    setHidden(await getHiddenExercises());
  }, []);
  useEffect(() => { loadCustom(); }, [loadCustom]);
  useFocusEffect(useCallback(() => { loadCustom(); }, [loadCustom]));
  const ALL = [...EXERCISES, ...custom.filter((c) => !EXERCISES.some((e) => e.id === c.id))].filter((e) => !hidden.has(e.id));
  const list = ALL.filter(
    (e) =>
      (e.name + e.muscle_group).toLowerCase().includes(q.toLowerCase()) &&
      (!muscle || e.muscle_group === muscle)
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Exercises 🏋️</H1>
      <Muted>{list.length} moves · real photos · tap to learn image-by-image.</Muted>
      <SearchInput value={q} onChange={setQ} placeholder="Search chest, squat…" />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['__all', ...MUSCLE_GROUPS]}
        keyExtractor={(m) => m}
        style={{ marginVertical: 4, maxHeight: 46, flexGrow: 0 }}
        renderItem={({ item: m }) => {
          const active = m === '__all' ? !muscle : muscle === m;
          return (
            <Pressable onPress={() => setMuscle(m === '__all' ? null : m)}>
              <View style={{ marginRight: 4 }}>
                <Chip
                  label={m === '__all' ? 'All' : m.replace('_', ' ')}
                  color={active ? (m === '__all' ? Colors.primary : MuscleColor[m]) : Colors.faint}
                />
              </View>
            </Pressable>
          );
        }}
      />
      <FlatList
        data={list}
        style={{ flex: 1 }}
        ListEmptyComponent={
          q.trim() ? (
            <View style={{ padding: 16 }}>
              <EmptyState title={`No match for "${q.trim()}"`} hint="Try another word — or add it as a new exercise." icon="search-outline" />
              <ActionCard title={`Add "${q.trim().length > 24 ? q.trim().slice(0, 24) + '…' : q.trim()}"`} desc="With 5 animated photos" icon="add-circle-outline" onPress={() => router.push(`/workouts/add?name=${encodeURIComponent(q.trim())}` as any)} />
            </View>
          ) : null
        }
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={{ paddingBottom: 24 }}>
            <ActionCard title="Add new exercise" desc="With 5 animated photos" icon="add-circle-outline" onPress={() => router.push('/workouts/add' as any)} />
            {hidden.size > 0 ? (
              <SmallButton title={`Show ${hidden.size} hidden`} icon="eye-outline" tone="ghost" onPress={async () => { await clearHiddenExercises(); loadCustom(); }} />
            ) : null}
            <Text style={useStyles().credit}>{PHOTO_CREDIT}</Text>
          </View>
        }
        renderItem={({ item: e }) => (
          <Pressable style={useStyles().bigCard} onPress={() => router.push(`/workouts/${e.id}` as any)}>
            <ExercisePhoto exerciseId={e.id} muscle={e.muscle_group} height={190} rounded={0} />
            <View style={useStyles().bigBody}>
              <View style={{ flex: 1 }}>
                <Text style={useStyles().bigName} numberOfLines={1}>{e.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <View style={[useStyles().dot, { backgroundColor: MuscleColor[e.muscle_group] }]} />
                  <Text style={useStyles().bigMeta}>{e.muscle_group.replace('_', ' ')} · {e.level} · {e.reps} × {e.sets}</Text>
                </View>
              </View>
              <View style={[useStyles().go, { borderColor: MuscleColor[e.muscle_group] }]}>
                <AppIcon name="chevron-forward" size={18} color={MuscleColor[e.muscle_group]} />
              </View>
            </View>
          </Pressable>
        )}
      />
          <BottomNav />
    </View>
  );
}
export default ExerciseList;

const useStyles = () => StyleSheet.create({
  bigCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.primary, marginVertical: 7, overflow: 'hidden', elevation: 3 },
  bigBody: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  bigName: { color: Colors.text, fontWeight: '800', fontSize: 16 },
  bigMeta: { color: Colors.muted, fontSize: 12, marginLeft: 6, textTransform: 'capitalize' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  go: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  credit: { color: Colors.muted, fontSize: 10, textAlign: 'center', marginTop: 8 },
});
