import { useState } from 'react';
import { ScrollView, TextInput, StyleSheet, View, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {Card, H1, Body, Muted, Chip, SubmitButton, BottomSpace, TopSpace, Field} from '../../src/components/ui';
import { toast } from '../../src/components/Toast';
import { FoodArt, foodColor } from '../../src/components/FoodArt';
import { addFoodToSupabase } from '../../src/lib/diet';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

const CATS = ['breakfast', 'grains', 'dal', 'protein', 'dairy', 'fruit', 'snack', 'veg'];

export default function AddFood() {
  const router = useRouter();
  const { name: initialName } = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(typeof initialName === 'string' ? initialName : '');
  const [category, setCategory] = useState('protein');
  const [serving, setServing] = useState('1 serving');
  const [cal, setCal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim() || !cal) return Alert.alert('Missing info', 'Name + calories are required.');
    setBusy(true);
    try {
      await addFoodToSupabase({
        name: name.trim(), category, serving: serving.trim() || '1 serving',
        calories: Number(cal) || 0, protein: Number(p) || 0, carbs: Number(c) || 0, fat: Number(f) || 0,
      });
      toast(`Saved ✓ — "${name.trim()}" is in the food database`);
      router.back();
    } catch (e: any) {
      toast(e?.message ?? 'Save failed — log in first', 'error');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>＋ Add Diet Item</H1>
      <Muted>Stored in Supabase foods — usable in meal logger instantly.</Muted>
      <Card accent={foodColor(category)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FoodArt foodId="custom" category={category} size={52} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Body>Live item image preview</Body>
            <Muted>Image follows the category you pick.</Muted>
          </View>
        </View>
      </Card>
      <Card>
        <Field label="Food name" value={name} onChangeText={setName} placeholder="e.g. Soya Chaap 100g" />
        <Body>Category</Body>
        <View style={useStyles().chips}>
          {CATS.map((cat) => (
            <Pressable key={cat} onPress={() => setCategory(cat)}>
              <View style={{ marginRight: 4, marginVertical: 2 }}>
                <Chip label={cat} color={category === cat ? foodColor(cat) : Colors.faint} />
              </View>
            </Pressable>
          ))}
        </View>
        <Field label="Serving" value={serving} onChangeText={setServing} placeholder="e.g. 1 bowl 200g" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Calories *" value={cal} onChangeText={setCal} placeholder="kcal" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Protein g" value={p} onChangeText={setP} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Carbs g" value={c} onChangeText={setC} placeholder="0" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Fat g" value={f} onChangeText={setF} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
      </Card>
      <SubmitButton title="Create diet item ✓" loading={busy} onPress={save} />
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, marginVertical: 6, color: Colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 },
});
