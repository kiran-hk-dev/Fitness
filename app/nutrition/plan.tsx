import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, View, Text } from 'react-native';
import {Card, H1, Body, Muted, PrimaryButton, SmallButton, SectionTitle, EmptyState, BottomSpace, TopSpace, Field} from '../../src/components/ui';
import { toast } from '../../src/components/Toast';
import { MEAL_TEMPLATES, GROCERY_LIST } from '../../src/data/mealTemplates';
import { saveDietPlan, getDietPlans, deleteDietPlan, type DietPlan } from '../../src/lib/diet';
import { FoodPhoto } from '../../src/components/FoodArt';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors, gridRow, cell } from '../../src/theme';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Representative animated photos per meal slot (pictures first, words second)
const MEAL_PHOTOS: Record<string, { id: string; cat: string; label: string }[]> = {
  'veg-day-1': [
    { id: 'idli', cat: 'breakfast', label: 'Breakfast' },
    { id: 'rice', cat: 'grains', label: 'Lunch' },
    { id: 'buttermilk', cat: 'dairy', label: 'Snack' },
    { id: 'paneer', cat: 'protein', label: 'Dinner' },
  ],
  'nonveg-day-1': [
    { id: 'upma', cat: 'breakfast', label: 'Breakfast' },
    { id: 'rice', cat: 'grains', label: 'Lunch' },
    { id: 'curd', cat: 'dairy', label: 'Snack' },
    { id: 'chapati', cat: 'grains', label: 'Dinner' },
  ],
  'quick-office': [
    { id: 'oats', cat: 'breakfast', label: 'Breakfast' },
    { id: 'rajma', cat: 'dal', label: 'Lunch' },
    { id: 'chana', cat: 'snack', label: 'Snack' },
    { id: 'dosa', cat: 'breakfast', label: 'Dinner' },
  ],
};

export default function Plan() {
  const s = useStyles();
  const [planName, setPlanName] = useState('My weekly plan');
  const [saved, setSaved] = useState<DietPlan[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setSaved(await getDietPlans()); } catch { setSaved([]); }
  };
  useEffect(() => { load(); }, []);

  const saveTemplate = async (tplId: string) => {
    const tpl = MEAL_TEMPLATES.find((m) => m.id === tplId);
    if (!tpl) return;
    if (!planName.trim()) return Alert.alert('Name needed', 'Give your plan a name first.');
    setBusy(true);
    try {
      // Repeat the template across 7 days — stored per account in Supabase
      const days = WEEK_DAYS.map((day) => ({
        day,
        breakfast: tpl.meals.breakfast, lunch: tpl.meals.lunch,
        snack: tpl.meals.snack, dinner: tpl.meals.dinner,
      }));
      await saveDietPlan(planName.trim(), tpl.diet, days);
      load();
    } catch (e: any) {
      toast(e?.message ?? 'Save failed — log in first', 'error');
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try { await deleteDietPlan(id); load(); }
    catch (e: any) { Alert.alert('Delete failed', e?.message ?? ''); }
  };

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>My Diet Plans 🍛</H1>
      <Muted>Plans are stored in Supabase under your account — they survive reinstalls.</Muted>

      <SectionTitle title="Saved in Supabase" icon="cloud-outline" right={`${saved.length}`} />
      {saved.length === 0 ? (
        <EmptyState title="No saved plans yet" hint="Name a plan below and tap Save on any template." icon="cloud-offline-outline" />
      ) : saved.map((p) => (
        <Card key={p.id} accent="#FF7A1A">
          <Body>{p.name} • {p.diet} • {p.days.length} days</Body>
          <Muted>{p.days.slice(0, 2).map((d) => `${d.day}: ${d.lunch}`).join('\n')}{p.days.length > 2 ? '\n…' : ''}</Muted>
          <SmallButton title="Delete" icon="trash-outline" tone="ghost" onPress={() => remove(p.id)} />
        </Card>
      ))}

      <SectionTitle title="Pick a template" icon="restaurant-outline" />
      <Card>
        <Field label="Plan name" value={planName} onChangeText={setPlanName} placeholder="e.g. Diwali week veg" />
      </Card>
      {MEAL_TEMPLATES.map((m) => (
        <Card key={m.id}>
          <Body>{m.name}</Body>
          {/* Meal slots: fixed-width cells on a shared gutter so the four
              columns line up with each other and with the card edges. */}
          <View style={s.slots}>
            {(MEAL_PHOTOS[m.id] ?? []).map((ph) => (
              <View key={ph.label} style={s.slotCell}>
                <FoodPhoto foodId={ph.id} category={ph.cat} size={44} />
                <Text style={s.slotLabel} numberOfLines={1}>
                  {ph.label}
                </Text>
              </View>
            ))}
          </View>
          <View style={s.divider} />
          <Text style={s.line}>
            <Text style={s.lineEmoji}>🌅</Text>
            {m.meals.breakfast}
          </Text>
          <Text style={s.line}>
            <Text style={s.lineEmoji}>☀️</Text>
            {m.meals.lunch}
          </Text>
          <Text style={s.line}>
            <Text style={s.lineEmoji}>🍎</Text>
            {m.meals.snack}
          </Text>
          <Text style={s.line}>
            <Text style={s.lineEmoji}>🌙</Text>
            {m.meals.dinner}
          </Text>
          <Muted style={{ marginTop: 8 }}>Swaps: {m.swaps.join(' • ')}</Muted>
          <PrimaryButton title="Save 7-day plan" loading={busy} icon="cloud-upload-outline" onPress={() => saveTemplate(m.id)} />
        </Card>
      ))}
      <SectionTitle title="Grocery list" icon="cart-outline" />
      <Card><Body>{GROCERY_LIST.join('\n')}</Body></Card>
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  slots: { ...gridRow(), marginTop: 10, marginBottom: 4 },
  slotCell: { ...cell(4), alignItems: 'center' },
  slotLabel: { color: Colors.muted, fontSize: 10, fontWeight: '800', marginTop: 5, textAlign: 'center' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  line: { color: Colors.text, fontSize: 13, lineHeight: 19, marginBottom: 5 },
  lineEmoji: { fontSize: 13, marginRight: 6 },
});
