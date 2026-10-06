import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PageHeader, Card, Body, Muted, PrimaryButton, GhostButton, PickButton, PickRow,
  BottomSpace, TopSpace, SectionTitle, DisclaimerBanner,
} from '../../src/components/ui';
import { RingProgress, CountUp } from '../../src/components/ActivityVisuals';
import { AppIcon } from '../../src/components/AppIcon';
import { useActivity } from '../../src/hooks/useActivity';
import { toast } from '../../src/components/Toast';
import { hydrationMessage, waterTargetMl } from '../../src/utils/hydration';
import { DEFAULT_WATER_TARGET, waterProgress } from '../../src/utils/steps';
import { Colors } from '../../src/theme';

const GOAL_CHOICES = [2000, 2500, 3000, 3500];

/** Filling-bottle illustration — the water level you have actually drunk. */
function Bottle({ pct, color }: { pct: number; color: string }) {
  const level = Math.min(1, Math.max(0, pct));
  const fillPct = level * 100;
  return (
    <View style={b.wrap}>
      {/* cap + neck */}
      <View style={[b.cap, { borderColor: color }]} />
      <View style={[b.neck, { borderColor: color }]} />
      {/* body: clipped so the "water" never spills outside the outline */}
      <View style={[b.body, { borderColor: color }]}>
        <View style={[b.shine, { backgroundColor: color + '33' }]} />
        <View style={[b.water, { height: `${fillPct}%`, backgroundColor: color + 'CC' }]} />
        <View style={b.measure}>
          {[75, 50, 25].map((y) => (
            <View key={y} style={b.tickRow}>
              <Text style={b.tick}>{y}%</Text>
              <View style={[b.tickLine, { backgroundColor: color + '55' }]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function WaterScreen() {
  const router = useRouter();
  const { today, refresh, addWater, undoWater } = useActivity();
  const [goal, setGoal] = useState(DEFAULT_WATER_TARGET);
  const [busy, setBusy] = useState(false);

  const pct = waterProgress(today.waterMl, goal);
  const remaining = Math.max(0, goal - today.waterMl);
  const litres = (today.waterMl / 1000).toFixed(2);

  const drink = async (ml: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await addWater(ml);
      toast(`+${ml} ml 💧`);
    } catch (e: any) {
      toast(e?.message ?? 'Could not save', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={Colors.accent} />}>
        <TopSpace height={44} />
        <Pressable style={s.back} onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="chevron-forward" size={20} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={s.backText}>Back</Text>
        </Pressable>

        <PageHeader title="Water" subtitle="Sip through the day" icon="water-outline" />

        <Card>
          <View style={s.split}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <RingProgress value={pct} size={168} thickness={16} color={Colors.accent} color2="#38BDF8" glow>
                <AppIcon name="water-outline" size={26} color={Colors.accent} />
                <CountUp to={today.waterMl} style={s.ml} />
                <Text style={s.mlGoal}>of {goal.toLocaleString()} ml</Text>
              </RingProgress>
              <Text style={s.litres}>{litres} L</Text>
            </View>
            <Bottle pct={pct} color={Colors.accent} />
          </View>

          <View style={s.statusPill}>
            <AppIcon name="information-circle" size={16} color={Colors.accent} />
            <Text style={s.statusText}>{hydrationMessage(today.waterMl, goal)}</Text>
          </View>
          {remaining > 0 ? (
            <Text style={s.remaining}>{remaining.toLocaleString()} ml left to hit your goal</Text>
          ) : (
            <Text style={[s.remaining, { color: Colors.accent, fontWeight: '900' }]}>
              Target reached — drink to thirst from here.
            </Text>
          )}
        </Card>

        <SectionTitle title="Drink now" icon="cafe-outline" />
        <View style={s.uuickRow}>
          {[200, 300, 500].map((ml) => (
            <Pressable
              key={ml}
              onPress={() => drink(ml)}
              disabled={busy}
              style={({ pressed }) => [s.uuick, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }, busy && { opacity: 0.6 }]}
            >
              <AppIcon name="water-outline" size={20} color={Colors.accent} />
              <Text style={s.uuickNum}>{ml} ml</Text>
              <Text style={s.uuickLab}>{ml === 200 ? 'glass' : ml === 300 ? 'mug' : 'bottle'}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton title="Undo last drink" icon="refresh-outline" onPress={undoWater} disabled={busy} />

        <SectionTitle title="Water bottles" icon="barbell-outline" />
        <Card>
          <Body>A bottle is usually 500 ml. Tap one each time you finish it.</Body>
          <View style={s.bottles}>
            {Array.from({ length: Math.ceil(goal / 500) }).map((_, i) => {
              const filled = today.waterMl >= (i + 1) * 500;
              return (
                <View key={i} style={s.bottleSlot}>
                  <View style={[s.bottle, filled && { borderColor: Colors.accent, backgroundColor: Colors.accent + '2A' }]}>
                    <Text style={{ fontSize: 20 }}>{filled ? '💧' : ''}</Text>
                  </View>
                  <Text style={s.bottleNum}>{(i + 1) * 500}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <SectionTitle title="Daily target" icon="speedometer-outline" />
        <PickRow>
          {GOAL_CHOICES.map((g) => (
            <PickButton key={g} label={`${(g / 1000).toFixed(g % 1000 ? 1 : 0)}L`} selected={goal === g} onPress={() => setGoal(g)} />
          ))}
        </PickRow>
        <GhostButton
          title="Estimate from my weight"
          icon="scale-outline"
          onPress={() => setGoal(waterTargetMl(70, true, false))}
        />

        <DisclaimerBanner text="Pale-yellow urine is a rough everyday sign you are drinking enough. Very clear urine plus constant drinking can mean too much. Medical fluid limits always override anything in this app." />
        <BottomSpace />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backText: { color: Colors.text, fontWeight: '800', fontSize: 15, marginLeft: 2 },
  split: { flexDirection: 'row', alignItems: 'center' },
  ml: { color: Colors.text, fontWeight: '900', fontSize: 26, marginTop: 2 },
  mlGoal: { color: Colors.muted, fontSize: 11, fontWeight: '700' },
  litres: { color: Colors.muted, fontSize: 13, fontWeight: '800', marginTop: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.raised, borderRadius: 14, padding: 12, marginTop: 16 },
  statusText: { color: Colors.text, fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1, lineHeight: 18 },
  remaining: { color: Colors.accent, fontWeight: '800', fontSize: 14, textAlign: 'center', marginTop: 10 },
  uuickRow: { flexDirection: 'row', marginHorizontal: -4 },
  uuick: { flex: 1, backgroundColor: Colors.raised, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginHorizontal: 4, borderWidth: 2, borderColor: Colors.accent },
  uuickNum: { color: Colors.text, fontWeight: '900', fontSize: 16, marginTop: 4 },
  uuickLab: { color: Colors.muted, fontSize: 11, fontWeight: '700' },
  bottles: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  bottleSlot: { alignItems: 'center', marginRight: 10, marginBottom: 10 },
  bottle: { width: 52, height: 74, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  bottleNum: { color: Colors.muted, fontSize: 10, fontWeight: '700', marginTop: 4 },
  
});

const b = StyleSheet.create({
  wrap: { width: 78, alignItems: 'center', marginLeft: 8 },
  cap: { width: 34, height: 12, borderWidth: 2.5, borderBottomWidth: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  neck: { width: 26, height: 10, borderWidth: 2.5, borderBottomWidth: 0 },
  body: { width: 74, height: 150, borderWidth: 2.5, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
  water: { width: '100%' },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: '100%', opacity: 0.35 },
  measure: { position: 'absolute', right: 4, top: 0, bottom: 0, justifyContent: 'space-evenly' },
  tickRow: { flexDirection: 'row', alignItems: 'center' },
  tick: { color: Colors.muted, fontSize: 8, fontWeight: '800', marginRight: 3 },
  tickLine: { width: 12, height: 1.5 },
});
