import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import {Card, H1, Body, Muted, DisclaimerBanner, BottomSpace, SectionTitle, TopSpace} from '../../src/components/ui';
import { ExercisePhoto } from '../../src/components/ExercisePhoto';
import { FoodPhoto } from '../../src/components/FoodArt';
import { PLATE_GUIDE } from '../../src/utils/nutrition';
import { HEALTH_DISCLAIMER, RECOVERY_RULES } from '../../src/utils/safety';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';

/** Animated plate: ½ veg · ¼ protein · ¼ grains — highlight cycles every segment. */
function RecoveryPlate() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % 3), 1600);
    return () => clearInterval(t);
  }, []);
  const segs = [
    { label: '½ VEG', color: '#34D399', cue: 'Fill half with sabzi/salad' },
    { label: '¼ PROTEIN', color: '#FF7A1A', cue: 'Dal / paneer / eggs / chicken' },
    { label: '¼ GRAINS', color: '#EAB308', cue: 'Rice / roti / millet' },
  ];
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={useStyles().plate}>
        <View style={[useStyles().half, { backgroundColor: segs[0].color + (active === 0 ? '' : '55'), borderColor: active === 0 ? Colors.text : 'transparent' }]} />
        <View style={{ flex: 1 }}>
          <View style={[useStyles().quarter, { backgroundColor: segs[1].color + (active === 1 ? '' : '55'), borderBottomWidth: 1, borderColor: Colors.bg, borderTopWidth: active === 1 ? 2 : 0, borderTopColor: Colors.text }]} />
          <View style={[useStyles().quarter, { backgroundColor: segs[2].color + (active === 2 ? '' : '55'), borderBottomWidth: active === 2 ? 2 : 0, borderBottomColor: Colors.text }]} />
        </View>
      </View>
      <Text style={[useStyles().segLabel, { color: segs[active].color }]}>{segs[active].label}</Text>
      <Text style={useStyles().segCue}>{segs[active].cue}</Text>
    </View>
  );
}

const CRAVINGS = [
  { id: 'banana', cat: 'fruit', label: 'Fruit' },
  { id: 'curd', cat: 'dairy', label: 'Yogurt' },
  { id: 'chana', cat: 'snack', label: 'Chana' },
  { id: 'nuts', cat: 'snack', label: 'Nuts' },
];

export default function Recovery() {
  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Kind Reset 💚</H1>
      <Muted>One heavy meal changes nothing. Follow the pictures back to routine.</Muted>

      <SectionTitle title="Step 1 · Hydrate" icon="water-outline" />
      <View style={useStyles().picCard}>
        <FoodPhoto foodId="buttermilk" category="dairy" size={120} />
        <View style={useStyles().picBar}>
          <Text style={useStyles().picCue}>Drink water / chaas normally — no extra litres, no detox</Text>
        </View>
      </View>

      <SectionTitle title="Step 2 · Move gently" icon="walk-outline" />
      <View style={useStyles().picCard}>
        <ExercisePhoto exerciseId="walking" muscle="cardio" height={170} rounded={0} />
        <View style={useStyles().picBar}>
          <Text style={useStyles().picCue}>A comfortable 10–20 min walk if you feel like it — never punishment</Text>
        </View>
      </View>

      <SectionTitle title="Step 3 · Next plate" icon="pizza-outline" />
      <Card>
        <RecoveryPlate />
        <Muted style={{ textAlign: 'center', marginTop: 8 }}>{PLATE_GUIDE}</Muted>
      </Card>

      <SectionTitle title="Step 4 · Protein next" icon="egg-outline" />
      <View style={useStyles().picCard}>
        <FoodPhoto foodId="dal" category="dal" size={120} />
        <View style={useStyles().picBar}>
          <Text style={useStyles().picCue}>Next meals: normal portions + dal/paneer + veg. Don't skip meals.</Text>
        </View>
      </View>

      <SectionTitle title="Craving toolkit" icon="basket-outline" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CRAVINGS.map((c) => (
          <View key={c.id} style={useStyles().crave}>
            <FoodPhoto foodId={c.id} category={c.cat} size={56} />
            <Text style={useStyles().craveText}>{c.label}</Text>
          </View>
        ))}
      </ScrollView>

      <Card>
        <Body>Also kind: unsweetened chai • brush teeth after dinner • planned small dessert • keep sweets out of sight.</Body>
      </Card>
      <DisclaimerBanner text={RECOVERY_RULES.join(' • ')} />
      <DisclaimerBanner text={HEALTH_DISCLAIMER} />
      <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  picCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, marginVertical: 6, alignItems: 'center', paddingVertical: 12 },
  picBar: { padding: 10 },
  picCue: { color: Colors.text, fontSize: 13.5, fontWeight: '600', textAlign: 'center' },
  plate: { width: 190, height: 190, borderRadius: 95, overflow: 'hidden', flexDirection: 'row', borderWidth: 3, borderColor: Colors.border },
  half: { flex: 1, borderWidth: 2 },
  quarter: { flex: 1 },
  segLabel: { fontWeight: '800', fontSize: 17, marginTop: 10 },
  segCue: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  crave: { alignItems: 'center', marginRight: 14, width: 80 },
  craveText: { color: Colors.text, fontSize: 12, marginTop: 6 },
});
