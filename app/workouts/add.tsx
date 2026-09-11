import { useState } from 'react';
import { ScrollView, TextInput, StyleSheet, View, Pressable, Alert, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {Card, H1, Body, Muted, Chip, SubmitButton, GhostButton, BottomSpace, TopSpace, Field} from '../../src/components/ui';
import { toast } from '../../src/components/Toast';
import { PickedGallery } from '../../src/components/ExercisePhoto';
import { MUSCLE_GROUPS } from '../../src/data/exercises';
import { MuscleColor, Colors } from '../../src/theme';
import { addExerciseToSupabase, uploadFrameSet } from '../../src/lib/diet';
import { BottomNav } from '../../src/components/BottomNav';

const LEVELS = ['easy', 'normal', 'advanced'];

export default function AddExercise() {
  const router = useRouter();
  const { name: initialName } = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(typeof initialName === 'string' ? initialName : '');
  const [muscle, setMuscle] = useState('chest');
  const [level, setLevel] = useState('easy');
  const [equipment, setEquipment] = useState('Bodyweight');
  const [reps, setReps] = useState('10-12');
  const [sets, setSets] = useState('3');
  const [steps, setSteps] = useState('');
  const [cues, setCues] = useState('');
  const [frames, setFrames] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const pickFrames = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to add demo frames.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.7,
    });
    if (!res.canceled) {
      const uris = res.assets.map((a) => a.uri);
      setFrames((f) => [...f, ...uris].slice(0, 5));
    }
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Give the exercise a name.');
    if (!frames.length) return Alert.alert('Add photos', 'Pick 1–5 demo photos — they become the animated guide.');
    setBusy(true);
    try {
      const stepList = steps.split('\n').map((s) => s.trim()).filter(Boolean);
      const cueList = cues.split('\n').map((s) => s.trim()).filter(Boolean);
      setStatus('Uploading photos …');
      const urls = await uploadFrameSet(frames, 'exercises');
      setStatus('Saving exercise …');
      await addExerciseToSupabase({
        name: name.trim(),
        muscleGroup: muscle,
        level,
        equipment: equipment.trim() || 'Bodyweight',
        instructions: stepList.length ? stepList : ['Setup in a stable position', 'Perform with control', 'Return slowly'],
        reps, sets: Number(sets) || 3,
        images: urls,
        focusCues: cueList,
      });
      toast(`Saved ✓ — "${name.trim()}" is live for everyone`);
      router.back();
    } catch (e: any) {
      toast(e?.message ?? 'Save failed — log in first', 'error');
    } finally { setBusy(false); setStatus(''); }
  };

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>＋ Add Exercise</H1>
      <Muted>Add 5 demo photos — they play as an animated guide for everyone.</Muted>

      <Card accent={MuscleColor[muscle]}>
        <Body>📸 Demo frames ({frames.length}/5) — in movement order</Body>
        {frames.length > 0 ? <PickedGallery uris={frames} height={190} /> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {frames.map((u, i) => (
            <Pressable key={u + i} onPress={() => setFrames((f) => f.filter((_, j) => j !== i))} style={useStyles().thumb}>
              <Text style={useStyles().thumbText}>{i + 1} ✕</Text>
            </Pressable>
          ))}
        </View>
        {frames.length < 5 ? (
          <GhostButton title={frames.length ? 'Add more photos' : 'Pick photos (up to 5)'} icon="images-outline" onPress={pickFrames} />
        ) : null}
      </Card>

      <Card>
        <Field label="Exercise name" value={name} onChangeText={setName} placeholder="e.g. Incline Dumbbell Fly" />
        <Body>Muscle group</Body>
        <View style={useStyles().chips}>
          {MUSCLE_GROUPS.map((m) => (
            <Pressable key={m} onPress={() => setMuscle(m)}>
              <View style={{ marginRight: 4, marginVertical: 2 }}>
                <Chip label={m.replace('_', ' ')} color={muscle === m ? MuscleColor[m] : Colors.faint} />
              </View>
            </Pressable>
          ))}
        </View>
        <Body>Level</Body>
        <View style={useStyles().chips}>
          {LEVELS.map((l) => (
            <Pressable key={l} onPress={() => setLevel(l)}>
              <View style={{ marginRight: 4, marginVertical: 2 }}>
                <Chip label={l} color={level === l ? '#38BDF8' : Colors.faint} />
              </View>
            </Pressable>
          ))}
        </View>
        <Field label="Equipment" value={equipment} onChangeText={setEquipment} placeholder="Bodyweight, dumbbells…" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Reps" value={reps} onChangeText={setReps} placeholder="8-12" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Sets" value={sets} onChangeText={setSets} placeholder="3" keyboardType="numeric" />
          </View>
        </View>
        <Field
          label="How to do it (one step per line)"
          value={steps} onChangeText={setSteps} multiline numberOfLines={4}
          placeholder={'Setup…\nMove…\nReturn…'}
        />
        <Field
          label="Focus cues (one per photo, in order)"
          value={cues} onChangeText={setCues} multiline numberOfLines={3}
          placeholder={'Brace your core\nSqueeze chest\nSlow lower'}
        />
      </Card>
      {status ? <Muted style={{ textAlign: 'center' }}>{status}</Muted> : null}
      <SubmitButton title="Create exercise ✓" loading={busy} onPress={save} />
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, marginVertical: 6, color: Colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 },
  thumb: { backgroundColor: Colors.raised, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginTop: 6, borderWidth: 1, borderColor: Colors.border },
  thumbText: { color: Colors.text, fontSize: 12, fontWeight: '700' },
});
