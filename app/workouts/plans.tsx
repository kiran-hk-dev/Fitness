import { useState } from 'react';
import { ScrollView, View, Text, Pressable, FlatList, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {H1, Muted, Body, Card, PrimaryButton, GhostButton, SectionTitle, BottomSpace, ActionCard, TopSpace} from '../../src/components/ui';
import { ExercisePhoto } from '../../src/components/ExercisePhoto';
import { LEVEL_PROGRAMS, WORKOUT_PLANS } from '../../src/data/workoutPlans';
import { EXERCISES } from '../../src/data/exercises';
import { useWorkoutStore } from '../../src/store/useWorkoutStore';
import { Colors } from '../../src/theme';
import { BottomNav } from '../../src/components/BottomNav';
import { AppIcon } from '../../src/components/AppIcon';

const CARD_W = Dimensions.get('window').width - 32;

export default function Plans() {
  const router = useRouter();
  const start = useWorkoutStore((s) => s.start);
  const [page, setPage] = useState(0);

  const begin = (programId: string) => {
    start('level:' + programId);
    router.push(`/workouts/active?program=${programId}` as any);
  };

  return (
    <View style={{ flex: 1 }}><ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <H1>Pick your level 🎯</H1>
      <Muted>Swipe the slider — 3 programs · 10 moves each.</Muted>

      {/* Horizontal snap slider */}
      <FlatList
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={LEVEL_PROGRAMS}
        keyExtractor={(p) => p.id}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / CARD_W))}
        renderItem={({ item: p }) => (
          <View style={[useStyles().tier, { width: CARD_W, borderColor: p.color + '66' }]}>
            <View style={[useStyles().tierHead, { backgroundColor: p.color + '14' }]}>
              <View style={{ flex: 1 }}>
                <Text style={useStyles().tierName}>{p.name} <Text style={useStyles().tierCount}>· {p.exercises.length} moves</Text></Text>
                <Text style={useStyles().tierTag}>{p.tagline}</Text>
              </View>
              <AppIcon name="trophy-outline" size={26} color={p.color} />
            </View>
            <View style={useStyles().thumbs}>
              {p.exercises.slice(0, 8).map((id) => {
                const e = EXERCISES.find((x) => x.id === id);
                if (!e) return null;
                return (
                  <Pressable key={id} style={useStyles().thumb} onPress={() => router.push(`/workouts/${id}` as any)}>
                    <ExercisePhoto exerciseId={id} muscle={e.muscle_group} height={56} rounded={10} />
                    <Text style={useStyles().thumbName} numberOfLines={1}>{e.name}</Text>
                  </Pressable>
                );
              })}
              <View style={useStyles().more}>
                <Text style={useStyles().moreText}>+{p.exercises.length - 8} more inside →</Text>
              </View>
            </View>
            <View style={{ padding: 12, paddingTop: 0 }}>
              <ActionCard title={`Start ${p.name}`} desc="10 moves · animated inside" icon="play" onPress={() => begin(p.id)} />
            </View>
          </View>
        )}
      />
      <View style={useStyles().dots}>
        {LEVEL_PROGRAMS.map((p, i) => (
          <View key={p.id} style={[useStyles().dot, { backgroundColor: i === page ? p.color : Colors.border, width: i === page ? 22 : 8 }]} />
        ))}
      </View>

      <SectionTitle title="More splits" icon="layers-outline" />
      {WORKOUT_PLANS.map((p) => (
        <Card key={p.id}>
          <Body>{p.name} ({p.days}d/wk)</Body>
          <Muted>{p.description}</Muted>
          <ActionCard
            title="Start session"
            desc={`${p.days} days/week`}
            icon="play"
            onPress={() => { start(p.id); router.push(`/workouts/active?plan=${p.id}` as any); }}
          />
        </Card>
      ))}
      <ActionCard title="All 63 exercises" desc="Photo library + search" icon="images-outline" onPress={() => router.push('/workouts/library' as any)} />
      <BottomSpace height={40} />
    </ScrollView><BottomNav /></View>
  );
}

const useStyles = () => StyleSheet.create({
  tier: { borderRadius: 18, borderWidth: 1.5, backgroundColor: Colors.card, marginVertical: 8, marginRight: 12, overflow: 'hidden' },
  tierHead: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  tierName: { color: Colors.text, fontWeight: '800', fontSize: 19 },
  tierCount: { color: Colors.muted, fontWeight: '600', fontSize: 13 },
  tierTag: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
  thumb: { width: '23%', margin: '1%' },
  thumbName: { color: Colors.muted, fontSize: 9, marginTop: 3, textAlign: 'center' },
  more: { width: '23%', margin: '1%', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  moreText: { color: Colors.muted, fontSize: 10, textAlign: 'center', fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: 6 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 3 },
});
