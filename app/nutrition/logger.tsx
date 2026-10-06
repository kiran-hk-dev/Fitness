import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Card, Muted, GhostButton, BottomSpace, TopSpace, PageHeader, SectionTitle,
  SearchInput, EmptyState, Chip,
} from '../../src/components/ui';
import { FoodPhoto } from '../../src/components/FoodArt';
import { RingProgress, CountUp } from '../../src/components/ActivityVisuals';
import { FadeIn, Stagger, BouncyPress, AnimatedCheck } from '../../src/components/Motion';
import { FOODS } from '../../src/data/foods';
import {
  QUICK_MEALS, quickMealsFor, quickMealCalories, quickMealCount,
} from '../../src/data/quickMeals';
import {
  MEAL_SLOTS, slotForNow, slotMeta, macrosFor, totalMacros, groupBySlot,
  clampQty, stepQty, rankByFrequency, groupByCategory,
  CATEGORY_EMOJI, loadFreq, loadTodayEntries, logEntry, updateQty, removeEntry,
  flushQueue, type LoggedEntry, type FreqMap, type MealSlot,
} from '../../src/lib/meals';
import { buildTargets } from '../../src/utils/nutrition';
import { getCustomTargets } from '../../src/lib/targets';
import { toast } from '../../src/components/Toast';
import { Colors, gridRow, cell } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';

/**
 * Logging a meal, with nothing to think about.
 *
 * There is no tray and no Save button. Tap a food, a tile or a preset and it
 * is already in today's log. Fix a mistake with the stepper or the ✕ on the
 * row. The slot is picked from the clock; override it with the tabs.
 */
export default function Logger() {
  const router = useRouter();
  const [slot, setSlot] = useState<MealSlot>(slotForNow());
  const [entries, setEntries] = useState<LoggedEntry[]>([]);
  const [freq, setFreq] = useState<FreqMap>({});
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [goal, setGoal] = useState(2000);
  const [flash, setFlash] = useState<string | null>(null);

  const totals = useMemo(() => totalMacros(entries), [entries]);
  const groups = useMemo(() => groupBySlot(entries), [entries]);
  const pct = Math.min(1, totals.calories / Math.max(1, goal));

  const refresh = useCallback(async () => {
    setFreq(await loadFreq());
    setEntries(await loadTodayEntries(FOODS));
    await flushQueue();
    setEntries(await loadTodayEntries(FOODS));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const custom = await getCustomTargets();
        const est = buildTargets({ weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'fat_loss' });
        setGoal(custom?.calories ?? est.calories);
      } catch {}
      refresh();
    })();
  }, [refresh]);

  const celebrate = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1300);
  };

  /** THE action: one tap logs one portion, instantly. */
  const tap = useCallback(
    async (foodId: string, qty = 1, overrideSlot?: MealSlot) => {
      const food = FOODS.find((f) => f.id === foodId);
      if (!food) return;
      const m = macrosFor(food, qty);
      setEntries((prev) => [
        {
          id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          slot: overrideSlot ?? slot,
          foodId: food.id,
          name: food.name,
          qty: clampQty(qty),
          ...m,
          logged_at: new Date().toISOString(),
          pending: true,
        },
        ...prev,
      ]);
      celebrate(`${m.calories} kcal added`);
      await logEntry({ slot: overrideSlot ?? slot, food, qty });
      await refresh();
    },
    [slot, refresh],
  );

  /** One tap logs a whole preset. */
  const tapPreset = useCallback(
    async (id: string) => {
      const qm = QUICK_MEALS.find((m) => m.id === id);
      if (!qm) return;
      const target = qm.slot;
      for (const it of qm.items) await tap(it.foodId, it.qty, target);
      setSlot(target);
      celebrate(`${qm.emoji} ${qm.name} · ${quickMealCalories(qm)} kcal`);
    },
    [tap],
  );

  const changeQty = async (entry: LoggedEntry, dir: 1 | -1) => {
    const next = stepQty(entry.qty, dir);
    if (next < 0.3) {
      await removeEntry(entry);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast(`${entry.name} removed`);
      return;
    }
    // optimistic
    const food = FOODS.find((f) => f.id === entry.foodId);
    if (food) {
      const m = macrosFor(food, next);
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, qty: next, ...m } : e)),
      );
    }
    await updateQty(entry, next);
    await refresh();
  };

  const drop = async (entry: LoggedEntry) => {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    await removeEntry(entry);
    toast(`${entry.name} removed — tap ↺ undo is not stored, re-add it if needed`);
  };

  const favourites = useMemo(() => rankByFrequency(FOODS, freq, 8), [freq]);
  const searchHits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return FOODS.filter((f) => f.name.toLowerCase().includes(term));
  }, [q]);

  const browseGroups = useMemo(
    () => groupByCategory(showAll || q.trim() ? FOODS : favourites),
    [showAll, q, favourites],
  );
  const presets = quickMealsFor(slot);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={Colors.primary} />}>
        <TopSpace height={40} />
        <Pressable style={s.back} onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="chevron-forward" size={20} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <FadeIn>
          <PageHeader title="Log Meal" subtitle="Tap anything — it's logged straight away" icon="restaurant-outline" />
        </FadeIn>

        {/* ---------- today ---------- */}
        <FadeIn delay={60}>
          <Card>
            <View style={s.todayRow}>
              <RingProgress value={pct} size={132} thickness={14} color={Colors.accent} color2="#38BDF8">
                <Text style={s.kcal}>
                  <CountUp to={totals.calories} style={{ color: Colors.text, fontWeight: '900', fontSize: 26 }} />
                </Text>
                <Text style={s.kcalLab}>kcal</Text>
              </RingProgress>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={s.goalRow}>
                  <Text style={s.goalTxt}>Goal {goal.toLocaleString()}</Text>
                  {totals.calories >= goal ? <Chip label="hit" color={Colors.accent} /> : null}
                </View>
                <View style={s.macroRow}>
                  <MacroDot label="P" value={`${totals.protein_g}g`} color="#F472B6" />
                  <MacroDot label="C" value={`${totals.carbs_g}g`} color="#38BDF8" />
                  <MacroDot label="F" value={`${totals.fat_g}g`} color="#FBBF24" />
                </View>
                <Text style={s.left}>
                  {totals.calories < goal
                    ? `${(goal - totals.calories).toLocaleString()} kcal left today`
                    : `Over target by ${(totals.calories - goal).toLocaleString()}`}
                </Text>
              </View>
            </View>
          </Card>
        </FadeIn>

        {/* ---------- slot override ---------- */}
        <FadeIn delay={110}>
          <View style={s.slotRow}>
            {MEAL_SLOTS.map((m) => {
              const active = slot === m.id;
              const count = entries.filter((e) => e.slot === m.id).length;
              return (
                <BouncyPress key={m.id} onPress={() => setSlot(m.id)} scaleTo={0.92} accessibilityLabel={`Log as ${m.label}`} style={{ flex: 1 }}>
                  <View style={[s.slot, active && { borderColor: Colors.primary, backgroundColor: Colors.primarySoft }]}>
                    <Text style={{ fontSize: 17 }}>{m.emoji}</Text>
                    <Text style={[s.slotLab, active && { color: Colors.primary }]} numberOfLines={1}>
                      {m.short}
                    </Text>
                    {count > 0 ? (
                      <View style={[s.slotCount, { backgroundColor: active ? Colors.primary : Colors.raised }]}>
                        <Text style={[s.slotCountTxt, { color: active ? Colors.onPrimary : Colors.muted }]}>{count}</Text>
                      </View>
                    ) : null}
                  </View>
                </BouncyPress>
              );
            })}
          </View>
          <Muted style={{ textAlign: 'center', marginTop: 6 }}>
            Logging as <Text style={{ color: Colors.primary, fontWeight: '800' }}>{slotMeta(slot).label}</Text> · tap to change
          </Muted>
        </FadeIn>

        {/* ---------- one-tap meals ---------- */}
        <SectionTitle title="One tap" icon="flash-outline" right="logs the whole meal" />
        <Stagger step={45} baseDelay={150}>
          {presets.map((m) => (
            <BouncyPress key={m.id} onPress={() => tapPreset(m.id)} scaleTo={0.96} accessibilityLabel={`Log ${m.name}`}>
              <View style={[s.preset, { borderColor: m.accent }]}>
                <View style={[s.presetIcon, { backgroundColor: m.accent + '22' }]}>
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.presetName}>{m.name}</Text>
                  <Text style={s.presetMeta}>
                    {quickMealCount(m)} items · {quickMealCalories(m)} kcal
                  </Text>
                </View>
                <View style={[s.plus, { backgroundColor: m.accent }]}>
                  <AppIcon name="add" size={18} color="#FFFFFF" />
                </View>
              </View>
            </BouncyPress>
          ))}
        </Stagger>

        {/* ---------- today's log ---------- */}
        <SectionTitle title="Logged today" icon="checkmark-circle-outline" right={`${entries.length} item${entries.length === 1 ? '' : 's'}`} />
        {groups.length === 0 ? (
          <Card>
            <EmptyState title="Nothing yet" hint="Tap a one-tap meal or a food below." icon="restaurant-outline" />
          </Card>
        ) : (
          <Stagger step={40} baseDelay={0} dy={8}>
            {groups.map((g) => (
              <Card key={g.slot} style={s.group}>
                <View style={s.groupHead}>
                  <Text style={{ fontSize: 17 }}>{g.emoji}</Text>
                  <Text style={s.groupName}>{g.label}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={s.groupKcal}>{g.kcal} kcal</Text>
                </View>
                {g.items.map((e) => (
                  <View key={e.id} style={s.entry}>
                    <FoodPhoto foodId={e.foodId} category={FOODS.find((f) => f.id === e.foodId)?.category ?? 'other'} size={34} />
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={s.entryName} numberOfLines={1}>{e.name}</Text>
                      <Text style={s.entryMeta}>
                        {e.calories} kcal · P{e.protein_g}g
                        {e.pending ? ' · syncing' : ''}
                      </Text>
                    </View>
                    <View style={s.stepper}>
                      <Pressable onPress={() => changeQty(e, -1)} hitSlop={8} style={({ pressed }) => [s.stepBtn, pressed && { opacity: 0.6 }]}>
                        <Text style={s.stepTxt}>−</Text>
                      </Pressable>
                      <View style={s.qtyBox}>
                        <Text style={s.qtyTxt}>{e.qty}</Text>
                      </View>
                      <Pressable onPress={() => changeQty(e, 1)} hitSlop={8} style={({ pressed }) => [s.stepBtn, pressed && { opacity: 0.6 }]}>
                        <Text style={s.stepTxt}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => drop(e)} hitSlop={10} style={({ pressed }) => [s.delBtn, pressed && { opacity: 0.5 }]}>
                      <AppIcon name="close" size={14} color={Colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </Card>
            ))}
          </Stagger>
        )}

        {/* ---------- add anything ---------- */}
        <SectionTitle
          title={q.trim() ? 'Search' : showAll ? 'All foods' : favourites.length ? 'Your foods' : 'Tap a food'}
          icon={q.trim() || showAll ? 'search' : 'flash-outline'}
          right={q.trim() || showAll ? `${FOODS.length} foods` : 'logged instantly'}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search idli, rice, paneer…" />

        {searchHits.length > 0 ? (
          <View style={s.foodGrid}>
            {searchHits.map((f) => (
              <FoodTile key={f.id} foodId={f.id} onTap={(qty) => tap(f.id, qty)} />
            ))}
          </View>
        ) : q.trim() ? (
          <EmptyState title={`No match for "${q.trim()}"`} hint="Try a shorter word." icon="search-outline" />
        ) : (
          <>
            {browseGroups.map((grp) => (
              <View key={grp.category}>
                <View style={s.catHead}>
                  <Text style={{ fontSize: 15 }}>{CATEGORY_EMOJI[grp.category] ?? '🍽️'}</Text>
                  <Text style={s.catName}>{grp.category}</Text>
                </View>
                <View style={s.foodGrid}>
                  {grp.items.map((f) => (
                    <FoodTile key={f.id} foodId={f.id} onTap={(qty) => tap(f.id, qty)} />
                  ))}
                </View>
              </View>
            ))}

            {!showAll ? (
              <>
                <GhostButton title="Show foods I haven't logged" icon="list-outline" onPress={() => setShowAll(true)} />
                {favourites.length === 0 ? (
                  <FadeIn>
                    <Muted style={{ textAlign: 'center' }}>
                      Logging a few meals will build this list around what you actually eat.
                    </Muted>
                  </FadeIn>
                ) : null}
              </>
            ) : (
              <GhostButton title="Back to my foods" icon="star-outline" onPress={() => setShowAll(false)} />
            )}
          </>
        )}

        <View style={s.note}>
          <AppIcon name="information-circle" size={15} color={Colors.muted} />
          <Text style={s.noteText}>
            Values are per serving. Use − and + to fix a portion — long-term accuracy comes from weighing your food, not from the app.
          </Text>
        </View>
        <BottomSpace />
      </ScrollView>

      <AnimatedCheck show={!!flash} label={flash ?? ''} />
    </View>
  );
}

// ---------------------------------------------------------------- food tile --

/** Tap = 1 portion. The small + logs 2. Big target, instant feedback. */
function FoodTile({ foodId, onTap }: { foodId: string; onTap: (qty: number) => void }) {
  const f = FOODS.find((x) => x.id === foodId);
  if (!f) return null;
  return (
    <View style={cell(3)}>
      <BouncyPress onPress={() => onTap(1)} scaleTo={0.92} accessibilityLabel={`Log ${f.name}, ${f.calories} calories`}>
        <View style={s.tile}>
          <FoodPhoto foodId={f.id} category={f.category} size={42} />
          {/* Fixed two-line box so kcal + macros land on the same baseline in
              every tile, whatever the food happens to be called. */}
          <Text style={s.tileName} numberOfLines={2}>{f.name}</Text>
          <View style={s.tileMetaBox}>
            <Text style={s.tileKcal}>{f.calories} kcal</Text>
            <Text style={s.tileMacro}>P{f.protein_g} C{f.carbs_g} F{f.fat_g}</Text>
          </View>
        </View>
      </BouncyPress>
      <Pressable onPress={() => onTap(2)} hitSlop={6} style={({ pressed }) => [s.tileTwo, pressed && { opacity: 0.6 }]}>
        <AppIcon name="add" size={11} color={Colors.primary} />
        <Text style={s.tileTwoTxt}>×2</Text>
      </Pressable>
    </View>
  );
}

function MacroDot({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={s.macroDot}>
      <View style={[s.macroBullet, { backgroundColor: color }]} />
      <Text style={s.macroVal}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: { color: Colors.text, fontWeight: '800', fontSize: 15, marginLeft: 2 },
  todayRow: { flexDirection: 'row', alignItems: 'center' },
  kcal: { color: Colors.text, fontWeight: '900', fontSize: 26 },
  kcalLab: { color: Colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalTxt: { color: Colors.text, fontWeight: '800', fontSize: 15 },
  macroRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },
  macroDot: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
  macroBullet: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  macroVal: { color: Colors.text, fontWeight: '800', fontSize: 13 },
  left: { color: Colors.muted, fontSize: 12, fontWeight: '700' },
  slotRow: gridRow(),
  slot: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, marginHorizontal: 4, backgroundColor: Colors.card },
  slotLab: { color: Colors.muted, fontSize: 11, fontWeight: '800', marginTop: 3 },
  slotCount: { position: 'absolute', top: -6, right: -2, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  slotCountTxt: { fontSize: 11, fontWeight: '900' },
  preset: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1.5, padding: 11, marginVertical: 4 },
  presetIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  presetName: { color: Colors.text, fontWeight: '900', fontSize: 14 },
  presetMeta: { color: Colors.muted, fontSize: 11, fontWeight: '700', marginTop: 1 },
  plus: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  group: { paddingHorizontal: 12, paddingVertical: 12 },
  groupHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  groupName: { color: Colors.text, fontWeight: '900', fontSize: 15, marginLeft: 8 },
  groupKcal: { color: Colors.primary, fontWeight: '900', fontSize: 14 },
  entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderTopColor: Colors.border },
  entryName: { color: Colors.text, fontWeight: '800', fontSize: 14 },
  entryMeta: { color: Colors.muted, fontSize: 11, marginTop: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.raised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  stepTxt: { color: Colors.text, fontWeight: '900', fontSize: 17, lineHeight: 20 },
  qtyBox: { minWidth: 34, alignItems: 'center' },
  qtyTxt: { color: Colors.text, fontWeight: '900', fontSize: 16 },
  delBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 6, backgroundColor: Colors.dangerSoft },
  catHead: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  catName: { color: Colors.text, fontWeight: '800', fontSize: 13, textTransform: 'capitalize', marginLeft: 6 },
  foodGrid: gridRow(),
  tile: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', height: 138, justifyContent: 'space-between' },
  tileName: { color: Colors.text, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 5, paddingHorizontal: 2, height: 26 },
  tileMetaBox: { alignItems: 'center' },
  tileKcal: { color: Colors.primary, fontSize: 11, fontWeight: '900', marginTop: 2 },
  tileMacro: { color: Colors.muted, fontSize: 9, fontWeight: '700', marginTop: 1 },
  tileTwo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 3, paddingVertical: 3 },
  tileTwoTxt: { color: Colors.primary, fontSize: 11, fontWeight: '900', marginLeft: 3 },
  note: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.raised, borderRadius: 12, padding: 12, marginTop: 16 },
  noteText: { color: Colors.muted, fontSize: 12, lineHeight: 17, flex: 1, marginLeft: 8 },
});