import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {Card, H1, Chip, ActionCard, DisclaimerBanner, BottomSpace, TopSpace, SmallButton} from '../../src/components/ui';
import { ExerciseGallery, ExercisePhoto } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { registerCustomImages, PHOTO_CREDIT } from '../../src/data/exerciseMedia';
import { supabase } from '../../src/lib/supabase';
import type { Exercise } from '../../src/types/app';
import { STOP_SIGNALS, SPOT_REDUCTION_NOTE } from '../../src/utils/progression';
import { MuscleColor, Colors } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';
import { hideExercise } from '../../src/lib/hidden';
import { toast } from '../../src/components/Toast';
import { AppIcon } from '../../src/components/AppIcon';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [customEx, setCustomEx] = useState<Exercise | null>(null);

  // Community items live in Supabase, not the bundled list
  useEffect(() => {
    if (EXERCISES.some((x) => x.id === id)) return;
    (async () => {
      const { data } = await supabase.from('exercises').select('*').eq('id', id).single();
      if (data) {
        if (data.images_json?.length) registerCustomImages(data.id, data.images_json);
        setCustomEx({
          id: data.id, name: data.name, muscle_group: data.muscle_group, level: data.level,
          equipment: data.equipment ?? '—', environment: data.environment ?? 'both',
          instructions: data.instructions_json?.length ? data.instructions_json : ['Follow the demo photos step by step'],
          reps: '10-12', sets: 3, rest_sec: 60, breathing: 'Steady breathing', tempo: 'controlled',
          mistakes: [], contraindications: '', regression: 'Easier version', progression: 'Harder version',
          media_url: null, thumbnail_url: null, tags: ['community'],
        });
      }
    })();
  }, [id]);

  const e = EXERCISES.find((x) => x.id === id) ?? customEx;
  if (!e) {
    return (
      <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
        <H1>Loading…</H1>
      </ScrollView><BottomNav /></View>
    );
  }
  const color = MuscleColor[e.muscle_group] ?? Colors.primary;

  // Image-by-image guide: alternate real photos, each with ONE focus cue
  const focusCues = [
    { end: false, tag: 'SETUP', cue: e.instructions[0] ?? 'Get into position', focus: 'Full-body tension' },
    { end: true, tag: 'MOVE', cue: e.instructions[1] ?? 'Perform the rep', focus: e.muscle_group.replace('_', ' ') },
    { end: false, tag: 'RETURN', cue: e.instructions[2] ?? e.instructions[0] ?? 'Control back', focus: 'Slow lowering' },
  ];

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      {/* Big animated demo */}
      <ExerciseGallery exerciseId={e.id} muscle={e.muscle_group} heroHeight={300} />

      <H1>{e.name}</H1>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label={e.muscle_group.replace('_', ' ')} color={color} icon="body-outline" />
        <Chip label={e.level} color="#38BDF8" icon="speedometer-outline" />
        <Chip label={`${e.sets}×${e.reps}`} color={Colors.primary} icon="repeat-outline" />
      </View>

      {/* Image-by-image: pictures teach, one line each */}
      <View style={useStyles().howHeader}>
        <AppIcon name="images-outline" size={18} color={Colors.primary} />
        <Text style={useStyles().howTitle}>Follow the pictures</Text>
      </View>
      {focusCues.map((f, i) => (
        <View key={i} style={useStyles().picCard}>
          <ExercisePhoto exerciseId={e.id} muscle={e.muscle_group} height={190} rounded={0} which={f.end ? 'end' : 'start'} />
          <View style={useStyles().picBar}>
            <View style={[useStyles().picStep, { backgroundColor: color }]}>
              <Text style={useStyles().picStepText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={useStyles().picCue}>{f.cue}</Text>
              <Text style={useStyles().picFocus}>🎯 Feel it: {f.focus}</Text>
            </View>
            <View style={[useStyles().picTag, { borderColor: color }]}>
              <Text style={[useStyles().picTagText, { color }]}>{f.tag}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Quick facts */}
      <View style={useStyles().statsRow}>
        {[`×${e.sets} sets`, `${e.reps}`, `${e.rest_sec}s rest`, e.tempo].map((s) => (
          <View key={s} style={useStyles().stat}><Text style={useStyles().statText}>{s}</Text></View>
        ))}
      </View>
      <View style={useStyles().breathStrip}>
        <AppIcon name="leaf-outline" size={15} color={Colors.primary} />
        <Text style={useStyles().breathText}>{e.breathing}</Text>
      </View>

      <Text style={useStyles().miniHead}>⚠️ Don't do this</Text>
      <View style={useStyles().chipWrap}>
        {e.mistakes.map((m) => (
          <Chip key={m} label={m} color="#F87171" icon="close-circle-outline" />
        ))}
      </View>

      <View style={useStyles().duo}>
        <Card accent={Colors.primary} style={{ flex: 1, marginRight: 4 }}>
          <Text style={useStyles().duoHead}>🟢 Easier</Text>
          <Text style={useStyles().duoText}>{e.regression}</Text>
        </Card>
        <Card accent={Colors.energy} style={{ flex: 1, marginLeft: 4 }}>
          <Text style={useStyles().duoHead}>🔥 Harder</Text>
          <Text style={useStyles().duoText}>{e.progression}</Text>
        </Card>
      </View>

      <DisclaimerBanner text={`Stop if: ${STOP_SIGNALS.join(' • ')}`} />
      {(e.muscle_group === 'core') && <DisclaimerBanner text={SPOT_REDUCTION_NOTE} />}
      <ActionCard title={`Start ${e.name}`} desc="Animated demo + form guide" icon="play" onPress={() => router.push('/workouts/active' as any)} />
      <SmallButton
        title={customEx ? 'Delete this exercise' : 'Hide this exercise'}
        icon="trash-outline"
        tone="danger"
        onPress={() => {
          Alert.alert(
            customEx ? 'Delete exercise?' : 'Hide exercise?',
            customEx
              ? 'Removes it from Supabase for everyone.'
              : 'Hides this built-in move from your library. Restore it anytime from the library footer.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: customEx ? 'Delete' : 'Hide',
                style: 'destructive',
                onPress: async () => {
                  if (customEx) {
                    const { error } = await supabase.from('exercises').delete().eq('id', customEx.id);
                    if (error) return toast(error.message, 'error');
                    toast('Exercise deleted');
                  } else {
                    await hideExercise(e.id);
                    toast('Hidden — restore it from the library footer');
                  }
                  router.back();
                },
              },
            ]
          );
        }}
      />
      <Text style={useStyles().credit}>{PHOTO_CREDIT}</Text>
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  howHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  howTitle: { color: Colors.text, fontWeight: '800', fontSize: 17, marginLeft: 6 },
  picCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.primary, marginVertical: 6, elevation: 3 },
  picBar: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  picStep: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  picStepText: { color: Colors.text, fontWeight: '800', fontSize: 14 },
  picCue: { color: Colors.text, fontSize: 13.5, fontWeight: '600' },
  picFocus: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  picTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginLeft: 8 },
  picTagText: { fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', marginTop: 10 },
  stat: { flex: 1, backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingVertical: 8, alignItems: 'center', marginHorizontal: 3 },
  statText: { color: Colors.text, fontWeight: '800', fontSize: 12 },
  breathStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySoft, borderRadius: 10, padding: 8, marginTop: 8, borderWidth: 1, borderColor: Colors.primary },
  breathText: { color: Colors.text, fontSize: 13, marginLeft: 6, flex: 1 },
  miniHead: { color: Colors.text, fontWeight: '800', fontSize: 15, marginTop: 14, marginBottom: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  duo: { flexDirection: 'row', marginTop: 4 },
  duoHead: { color: Colors.text, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  duoText: { color: Colors.muted, fontSize: 12, lineHeight: 17 },
  credit: { color: Colors.muted, fontSize: 10, textAlign: 'center', marginVertical: 10 },
});
