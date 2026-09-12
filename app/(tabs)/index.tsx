import { useCallback, useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {Card, H1, Body, Muted, PrimaryButton, DisclaimerBanner, BottomSpace, ActionCard, TopSpace, PageHeader, Field, SmallButton} from '../../src/components/ui';
import { ExerciseGallery } from '../../src/components/ExercisePhoto';
import { EXERCISES } from '../../src/data/exercises';
import { buildTargets } from '../../src/utils/nutrition';
import { useAppStore } from '../../src/store/useAppStore';
import { SPOT_REDUCTION_NOTE } from '../../src/utils/progression';
import { getDailySummary, pruneOldLogs, type DailySummary } from '../../src/lib/tracking';
import { getCustomTargets, setCustomTargets, clearCustomTargets, type CustomTargets } from '../../src/lib/targets';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';

const QUICK = [
  { title: 'Workout', icon: 'barbell-outline', route: '/workouts/plans' },
  { title: 'Log Meal', icon: 'restaurant-outline', route: '/nutrition/logger' },
  { title: 'Yoga', icon: 'body-outline', route: '/yoga' },
  { title: 'Recovery', icon: 'heart-outline', route: '/nutrition/recovery' },
] as const;

export default function Home() {
  const router = useRouter();
  const water = useAppStore((s) => s.waterTodayMl);
  const addWater = useAppStore((s) => s.addWater);
  const t = buildTargets({ weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'fat_loss' });
  const [today, setToday] = useState<DailySummary | null>(null);
  const [custom, setCustom] = useState<CustomTargets | null>(null);
  const [editing, setEditing] = useState(false);
  const [fCal, setFCal] = useState('');
  const [fPro, setFPro] = useState('');
  const [fWat, setFWat] = useState('');

  // Move of the day rotates daily — animated demo right on Home
  const move = EXERCISES[Math.floor(Date.now() / 86400000) % EXERCISES.length];

  const load = useCallback(async () => {
    try { setToday(await getDailySummary()); } catch { setToday(null); }
    try { setCustom(await getCustomTargets()); } catch {}
    // Auto-delete logs older than 3 days (per account, silent)
    pruneOldLogs().catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const showCal = custom?.calories ?? t.calories;
  const showPro = custom?.protein_g ?? t.protein_g;
  const showWat = custom?.water_ml ?? t.water_ml;

  const openEditor = () => {
    setFCal(String(showCal));
    setFPro(String(showPro));
    setFWat(String(showWat));
    setEditing(true);
  };

  const saveTargets = async () => {
    const cal = Number(fCal), pro = Number(fPro), wat = Number(fWat);
    if (!(cal > 800 && cal < 8000)) return toast('Calories must be 800–8000', 'error');
    if (!(pro >= 0 && pro < 500)) return toast('Protein must be 0–500 g', 'error');
    if (!(wat > 0 && wat <= 10000)) return toast('Water must be 1–10000 ml', 'error');
    await setCustomTargets({ calories: Math.round(cal), protein_g: Math.round(pro), water_ml: Math.round(wat) });
    setCustom({ calories: Math.round(cal), protein_g: Math.round(pro), water_ml: Math.round(wat) });
    setEditing(false);
    toast('Targets saved ✓ — showing yours now');
  };

  const resetTargets = async () => {
    await clearCustomTargets();
    setCustom(null);
    setEditing(false);
    toast('Back to estimated targets');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <TopSpace />
      <PageHeader title="Today" subtitle="Move · eat · sleep · repeat" icon="sunny-outline" />

      {/* Animated move of the day */}
      <Pressable style={useStyles().moveCard} onPress={() => router.push(`/workouts/${move.id}` as any)}>
        <ExerciseGallery exerciseId={move.id} muscle={move.muscle_group} heroHeight={200} />
        <View style={useStyles().moveBar}>
          <View style={{ flex: 1 }}>
            <Text style={useStyles().moveKick}>MOVE OF THE DAY</Text>
            <Text style={useStyles().moveName}>{move.name} — tap to learn ➜</Text>
          </View>
        </View>
      </Pressable>

      <View style={useStyles().statStrip}>
        <View style={useStyles().miniStat}><Text style={useStyles().miniVal}>{showCal}</Text><Text style={useStyles().miniLab}>kcal target</Text></View>
        <View style={useStyles().miniStat}><Text style={useStyles().miniVal}>{showPro}g</Text><Text style={useStyles().miniLab}>protein target</Text></View>
        <View style={useStyles().miniStat}><Text style={useStyles().miniVal}>{water}/{showWat}</Text><Text style={useStyles().miniLab}>ml water</Text></View>
        <Pressable style={useStyles().miniAdd} onPress={() => addWater(250)}>
          <AppIcon name="add" size={18} color={Colors.text} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
        <Muted>{custom ? '🎯 Showing YOUR targets' : '🤖 Showing estimated targets'}</Muted>
        <View style={{ flex: 1 }} />
        <SmallButton title={editing ? 'Close' : '🎯 Set targets'} tone="ghost" onPress={() => (editing ? setEditing(false) : openEditor())} />
      </View>
      {editing ? (
        <Card accent={Colors.primary}>
          <Field label="Calories target (kcal)" value={fCal} onChangeText={setFCal} placeholder="e.g. 2200" keyboardType="numeric" />
          <Field label="Protein target (g)" value={fPro} onChangeText={setFPro} placeholder="e.g. 120" keyboardType="numeric" />
          <Field label="Water target (ml)" value={fWat} onChangeText={setFWat} placeholder="e.g. 3000" keyboardType="numeric" />
          <PrimaryButton title="Save my targets ✓" onPress={saveTargets} />
          {custom ? <SmallButton title="Back to estimates" tone="ghost" onPress={resetTargets} /> : null}
        </Card>
      ) : null}

      <Card>
        <Body>⚖️ {today?.weightKg != null ? `${today.weightKg} kg` : '— weight'}</Body>
        <Body>🧘 {today && today.yogas.length ? today.yogas.map((y) => `${y.name} × ${y.times}`).join(' • ') : 'no yoga yet'}</Body>
        <Body>💪 {today && today.workouts.length ? today.workouts.map((w) => `${w.name} × ${w.times}`).join(' • ') : 'no training yet'}</Body>
        <ActionCard title="Share my day" desc="Weight + yoga × times" icon="share-social-outline" onPress={() => router.push('/progress/share' as any)} />
      </Card>

      <View style={useStyles().quickGrid}>
        {QUICK.map((a) => (
          <Pressable key={a.title} style={useStyles().quick} onPress={() => router.push(a.route as any)}>
            <AppIcon name={a.icon as any} size={22} color={Colors.primary} />
            <Text style={useStyles().quickText}>{a.title}</Text>
          </Pressable>
        ))}
      </View>

      <ActionCard
        title="＋ Contribute • v4"
        desc="Add your own exercise, yoga flow or diet item"
        icon="add-circle-outline"
        accent={Colors.primary}
        onPress={() => Alert.alert('Contribute', 'Add your own content — visible to everyone in the app.', [
          { text: 'Exercise', onPress: () => router.push('/workouts/add' as any) },
          { text: 'Yoga flow', onPress: () => router.push('/yoga/add' as any) },
          { text: 'Diet item', onPress: () => router.push('/nutrition/add-food' as any) },
          { text: 'Cancel', style: 'cancel' },
        ])}
      />

      <Card>
        <Body>Suggestion: trained legs yesterday? Choose upper body, yoga or recovery today.</Body>
      </Card>
      <DisclaimerBanner text={SPOT_REDUCTION_NOTE} />
      <BottomSpace />
    </ScrollView>
  );
}

const useStyles = () => StyleSheet.create({
  moveCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  moveBar: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  moveKick: { color: Colors.primary, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  moveName: { color: Colors.text, fontWeight: '800', fontSize: 15, marginTop: 2 },
  statStrip: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  miniStat: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingVertical: 8, alignItems: 'center', marginHorizontal: 3 },
  miniVal: { color: Colors.text, fontWeight: '800', fontSize: 15 },
  miniLab: { color: Colors.muted, fontSize: 10 },
  miniAdd: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  quickGrid: { flexDirection: 'row', marginVertical: 6 },
  quick: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, alignItems: 'center', marginHorizontal: 3 },
  quickText: { color: Colors.text, fontSize: 11, fontWeight: '700', marginTop: 4 },
});
