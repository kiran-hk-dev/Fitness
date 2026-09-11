import { useState } from 'react';
import { ScrollView, TextInput, StyleSheet, View, Pressable, Alert, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {Card, H1, Body, Muted, Chip, SubmitButton, GhostButton, BottomSpace, TopSpace, Field} from '../../src/components/ui';
import { toast } from '../../src/components/Toast';
import { PickedGallery } from '../../src/components/ExercisePhoto';
import { addYogaToSupabase, uploadFrameSet } from '../../src/lib/diet';
import { Colors } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';

const LEVELS = ['easy', 'normal', 'advanced'];

export default function AddYoga() {
  const router = useRouter();
  const { name: initialName } = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(typeof initialName === 'string' ? initialName : '');
  const [level, setLevel] = useState('easy');
  const [duration, setDuration] = useState('20');
  const [focus, setFocus] = useState('Flexibility');
  const [poses, setPoses] = useState('');
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
    if (!name.trim()) return Alert.alert('Missing name', 'Give the session a name.');
    if (!frames.length) return Alert.alert('Add photos', 'Pick 1–5 pose photos — they animate as the flow preview.');
    const poseList = poses.split('\n').map((s) => s.trim()).filter(Boolean);
    const finalPoses = poseList.length ? poseList : ['Breathing', 'Gentle stretch'];
    setBusy(true);
    try {
      setStatus('Uploading photos …');
      const urls = await uploadFrameSet(frames, 'yoga');
      setStatus('Saving flow …');
      await addYogaToSupabase({
        name: name.trim(), level,
        durationMin: Number(duration) || 20,
        focus: focus.trim() || 'General',
        poses: finalPoses,
        images: urls,
        // pair each pose name with a frame + cue so detail explains image-by-image
        poseDetails: finalPoses.map((p, i) => ({
          name: p,
          image: urls[Math.min(i, urls.length - 1)],
          cue: `Hold ${p} with steady breathing`,
        })),
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
      <H1>＋ Add Yoga</H1>
      <Muted>Add up to 5 pose photos — they animate as the flow preview.</Muted>

      <Card accent="#2DD4BF">
        <Body>📸 Flow frames ({frames.length}/5) — in pose order</Body>
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
        <Field label="Session name" value={name} onChangeText={setName} placeholder="e.g. Evening Hip Flow" />
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Minutes" value={duration} onChangeText={setDuration} placeholder="20" keyboardType="numeric" />
          </View>
          <View style={{ flex: 2 }}>
            <Field label="Focus" value={focus} onChangeText={setFocus} placeholder="hips, back…" />
          </View>
        </View>
        <Field
          label="Poses (one per line, matching photo order)"
          value={poses} onChangeText={setPoses} multiline numberOfLines={4}
          placeholder={'Warrior II\nBridge\nChild pose'}
        />
      </Card>
      {status ? <Muted style={{ textAlign: 'center' }}>{status}</Muted> : null}
      <SubmitButton title="Create yoga flow ✓" loading={busy} onPress={save} />
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
