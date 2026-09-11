import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {Card, H1, Body, Muted, Chip, ActionCard, DisclaimerBanner, BottomSpace, TopSpace, SmallButton} from '../../src/components/ui';
import { YogaPhoto, PickedGallery, YogaGallery } from '../../src/components/ExercisePhoto';
import { YOGA_SESSIONS, YOGA_POSES } from '../../src/data/yoga';
import { registerCustomImages } from '../../src/data/exerciseMedia';
import { supabase } from '../../src/lib/supabase';
import { logTraining } from '../../src/lib/tracking';
import { Colors, MuscleColor } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';
import { hideSession } from '../../src/lib/hidden';
import { toast } from '../../src/components/Toast';

export default function YogaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const local = YOGA_SESSIONS.find((x) => x.id === id);
  const [custom, setCustom] = useState<any | null>(null);

  // Community sessions live in Supabase
  useEffect(() => {
    if (local) return;
    (async () => {
      const { data } = await supabase.from('yoga_sessions').select('*').eq('id', id).single();
      if (data) {
        if (data.images_json?.length) registerCustomImages(data.id, data.images_json);
        setCustom(data);
      }
    })();
  }, [id]);

  // ---- Community session view: animated 5-frame gallery + pose chips + log ----
  if (!local) {
    if (!custom) {
      return (
        <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
          <H1>Loading…</H1>
        </ScrollView><BottomNav /></View>
      );
    }
    const poses: string[] = custom.poses_json ?? [];
    const logDone = async () => {
      try {
        await logTraining({ kind: 'yoga', itemId: custom.id, itemName: custom.name, durationMin: custom.duration_min ?? 15 });
        Alert.alert('Logged ✓', `"${custom.name}" counted in today's yoga.`);
      } catch (e: any) {
        Alert.alert('Log failed', e?.message ?? 'Log in first.');
      }
    };
    return (
      <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
        <H1>{custom.name} 🌿</H1>
        <Muted>{custom.duration_min ?? 15} min • {custom.level} • {custom.focus} • added by the community</Muted>
        {custom.images_json?.length ? (
          <PickedGallery uris={custom.images_json} height={260} />
        ) : null}
        <Text style={useStyles().miniHead}>Poses in this flow</Text>
        <View style={useStyles().chipWrap}>
          {poses.map((p: string) => (
            <Chip key={p} label={p} color={MuscleColor.mobility} icon="body-outline" />
          ))}
        </View>
        <DisclaimerBanner text="Avoid pain, dizziness, breath-holding. Move gently." />
        <ActionCard title="Log this session" desc="Counts in today's yoga" icon="checkmark-done" onPress={logDone} />
        <SmallButton
          title="Delete this flow"
          icon="trash-outline"
          tone="danger"
          onPress={() => {
            Alert.alert('Delete flow?', 'Removes it from Supabase for everyone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                  const { error } = await supabase.from('yoga_sessions').delete().eq('id', custom.id);
                  if (error) return toast(error.message, 'error');
                  toast('Flow deleted');
                  router.back();
                },
              },
            ]);
          }}
        />
      </ScrollView><BottomNav /></View>
    );
  }

  // ---- Bundled session view ----
  const s = local;
  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <H1>{s.name}</H1>
      <Muted>{s.duration_min} min • {s.level} • {s.focus}</Muted>
      <Text style={useStyles().howTitle}>Follow the pictures — how to do each pose</Text>
      {s.poses.map((pid, i) => {
        const p = YOGA_POSES.find((x) => x.id === pid);
        if (!p) return null;
        return (
          <View key={pid} style={useStyles().picCard}>
            <YogaGallery poseId={pid} height={190} />
            <View style={useStyles().picBar}>
              <View style={useStyles().picStep}>
                <Text style={useStyles().picStepText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={useStyles().poseName}>{p.name} · {p.duration_sec}s</Text>
                <Text style={useStyles().poseLine}>🫁 {p.breathing}</Text>
                <Text style={useStyles().poseLine}>🧍 {p.setup}</Text>
                <Text style={useStyles().poseLine}>🟢 Easier: {p.easier}</Text>
                <Text style={useStyles().poseWarn}>⚠ {p.caution}</Text>
              </View>
            </View>
          </View>
        );
      })}
      <DisclaimerBanner text="Avoid pain, dizziness, breath-holding. Advanced balances need adequate mobility + optional instructor guidance." />
      <ActionCard title="Start session" desc="Guided poses with pictures" icon="play" onPress={() => router.push(`/yoga/active?id=${s.id}` as any)} />
      <SmallButton
        title="Hide this flow"
        icon="eye-off-outline"
        tone="ghost"
        onPress={() => {
          Alert.alert('Hide flow?', 'Hides this built-in flow from your list. Restore it anytime from the yoga footer.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Hide', style: 'destructive',
              onPress: async () => {
                await hideSession(s.id);
                toast('Hidden — restore it from the yoga footer');
                router.back();
              },
            },
          ]);
        }}
      />
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  stepN: { color: Colors.primary, fontWeight: '800', fontSize: 10 },
  howTitle: { color: Colors.text, fontWeight: '800', fontSize: 16, marginTop: 12, marginBottom: 4 },
  picCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.primary, marginVertical: 6, elevation: 3 },
  picBar: { flexDirection: 'row', padding: 10 },
  picStep: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2DD4BF22', borderWidth: 1, borderColor: '#2DD4BF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  picStepText: { color: '#2DD4BF', fontWeight: '800', fontSize: 14 },
  poseName: { color: Colors.text, fontWeight: '800', fontSize: 15 },
  poseLine: { color: Colors.muted, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  poseWarn: { color: '#F59E0B', fontSize: 12, marginTop: 3 },
  miniHead: { color: Colors.text, fontWeight: '800', fontSize: 15, marginTop: 12, marginBottom: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
