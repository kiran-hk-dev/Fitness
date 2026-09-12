import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import {H1, Body, Muted, Chip, BottomSpace, SearchInput, ActionCard, TopSpace, SmallButton, EmptyState} from '../../src/components/ui';
import { PoseSlideshow, YogaPhoto, PickedGallery } from '../../src/components/ExercisePhoto';
import { YOGA_SESSIONS, YOGA_POSES } from '../../src/data/yoga';
import { PHOTO_CREDIT, registerCustomImages } from '../../src/data/exerciseMedia';
import { getSupabaseYoga } from '../../src/lib/diet';
import { getHiddenSessions, clearHiddenSessions } from '../../src/lib/hidden';
import { Colors, MuscleColor } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';
import { AppIcon } from '../../src/components/AppIcon';

export default function YogaIndex() {
  const router = useRouter();
  const [custom, setCustom] = useState<any[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const loadYoga = useCallback(async () => {
    try {
      const rows = await getSupabaseYoga();
      rows.forEach((r: any) => r.images_json?.length && registerCustomImages(r.id, r.images_json));
      setCustom(rows);
    } catch {}
    setHidden(await getHiddenSessions());
  }, []);
  useEffect(() => { loadYoga(); }, [loadYoga]);
  useFocusEffect(useCallback(() => { loadYoga(); }, [loadYoga]));
  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Yoga 🧘</H1>
      <Muted>Watch the flow preview, then follow pose-by-pose pictures.</Muted>
      <SearchInput value={q} onChange={setQ} placeholder="Search sessions, poses…" />

      {YOGA_SESSIONS.filter((s) => !hidden.has(s.id)).filter((s) => (s.name + s.focus).toLowerCase().includes(q.toLowerCase())).map((s) => (
        <Pressable key={s.id} style={useStyles().bigCard} onPress={() => router.push(`/yoga/${s.id}` as any)}>
          {/* Animated: auto-cycles through the session's poses */}
          <PoseSlideshow poseIds={s.poses} height={190} />
          <View style={useStyles().bigBody}>
            <View style={{ flex: 1 }}>
              <Text style={useStyles().bigName}>{s.name}</Text>
              <View style={useStyles().chips}>
                <Chip label={`${s.duration_min} min`} color={MuscleColor.mobility} />
                <Chip label={s.level} color="#38BDF8" />
                <Chip label={`${s.poses.length} poses`} color="#94A3B8" />
              </View>
              <Muted>{s.focus}</Muted>
            </View>
            <View style={useStyles().go}>
              <AppIcon name="chevron-forward" size={18} color={MuscleColor.mobility} />
            </View>
          </View>
        </Pressable>
      ))}

      <View style={useStyles().secRow}>
        <AppIcon name="body-outline" size={18} color={Colors.primary} />
        <Text style={useStyles().secTitle}>Pose library</Text>
      </View>
      {YOGA_POSES.filter((p) => (p.name + p.level).toLowerCase().includes(q.toLowerCase())).map((p, i) => (
        <View key={p.id} style={useStyles().poseCard}>
          <View style={{ width: 128 }}>
            <YogaPhoto poseId={p.id} height={104} />
          </View>
          <View style={useStyles().info}>
            <Text style={useStyles().stepN}>STEP {i + 1}</Text>
            <Text style={useStyles().poseName} numberOfLines={2}>{p.name}</Text>
            <Text style={useStyles().poseSub}>{p.duration_sec}s · {p.level}</Text>
            <Text style={useStyles().poseBreath} numberOfLines={2}>🫁 {p.breathing}</Text>
          </View>
        </View>
      ))}
      {custom.length > 0 ? (
        <View style={useStyles().secRow}>
          <AppIcon name="people-outline" size={18} color={Colors.primary} />
          <Text style={useStyles().secTitle}>Community flows ({custom.length})</Text>
        </View>
      ) : null}
      {custom.filter((s: any) => (s.name + (s.focus ?? '')).toLowerCase().includes(q.toLowerCase())).map((s: any) => (
        <Pressable key={s.id} style={useStyles().bigCard} onPress={() => router.push(`/yoga/${s.id}` as any)}>
          {s.images_json?.length ? (
            <PickedGallery uris={s.images_json} height={170} />
          ) : null}
          <View style={useStyles().bigBody}>
            <View style={{ flex: 1 }}>
              <Body>{s.name} 🌿</Body>
              <View style={useStyles().chips}>
                <Chip label={`${s.duration_min ?? 15} min`} color={MuscleColor.mobility} />
                <Chip label={s.level} color="#38BDF8" />
              </View>
              <Muted>{s.focus}</Muted>
            </View>
            <View style={useStyles().go}>
              <AppIcon name="chevron-forward" size={18} color={MuscleColor.mobility} />
            </View>
          </View>
        </Pressable>
      ))}
      {q.trim() ? (
        <ActionCard title={`Can't find it? Add "${q.trim().length > 22 ? q.trim().slice(0, 22) + '…' : q.trim()}"`} desc="Name is prefilled for you" icon="add-circle" onPress={() => router.push(`/yoga/add?name=${encodeURIComponent(q.trim())}` as any)} />
      ) : null}
      {hidden.size > 0 ? (
        <SmallButton title={`Show ${hidden.size} hidden`} icon="eye-outline" tone="ghost" onPress={async () => { await clearHiddenSessions(); loadYoga(); }} />
      ) : null}
      <Text style={useStyles().credit}>{PHOTO_CREDIT}</Text>
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  bigCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.primary, marginVertical: 7, overflow: 'hidden', elevation: 3 },
  bigBody: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  bigName: { color: Colors.text, fontWeight: '800', fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 },
  go: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: MuscleColor.mobility, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  secRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  secTitle: { color: Colors.text, fontWeight: '800', fontSize: 17, marginLeft: 6 },
  poseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.primary, padding: 10, marginVertical: 5, elevation: 2 },
  info: { flex: 1, marginLeft: 12 },
  stepN: { color: Colors.primary, fontWeight: '800', fontSize: 10 },
  poseName: { color: Colors.text, fontWeight: '800', fontSize: 15 },
  poseSub: { color: Colors.muted, fontSize: 12, marginTop: 1, textTransform: 'capitalize' },
  poseBreath: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  credit: { color: Colors.muted, fontSize: 10, textAlign: 'center', marginVertical: 10 },
});
