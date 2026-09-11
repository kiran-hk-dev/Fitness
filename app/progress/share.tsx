import { useCallback, useState } from 'react';
import { ScrollView, Share, Alert, RefreshControl, View } from 'react-native';
import {Card, H1, Body, Muted, BottomSpace, ActionCard, TopSpace} from '../../src/components/ui';
import { BottomNav } from '../../src/components/BottomNav';
import { Colors } from '../../src/theme';
import {
  getDailySummary, buildShareText, saveShareSnapshot,
  type DailySummary, todayKey,
} from '../../src/lib/tracking';

export default function ShareScreen() {
  const [s, setS] = useState<DailySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setS(await getDailySummary(todayKey()));
    } catch (e: any) {
      Alert.alert('Sign in required', e?.message ?? 'Create an account first.');
    } finally { setRefreshing(false); }
  }, []);

  const share = async () => {
    if (!s) return load();
    const text = buildShareText(s);
    try {
      await saveShareSnapshot(s); // keep history in daily_shares
    } catch {}
    await Share.share({ message: text, title: 'My FitLife 360 day' });
  };

  return (
    <View style={{ flex: 1 }}><ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <TopSpace />
      <H1>Today — share 📤</H1>
      <Muted>Pull to load. Shows your weight + yoga names × times + workout checkmarks for today, all from your Supabase account.</Muted>
      {!s ? (
        <Card><Body>Tap load to fetch today's summary.</Body></Card>
      ) : (
        <>
          <Card>
            <Body>📅 {s.date}</Body>
            <Body>⚖️ Weight: {s.weightKg != null ? `${s.weightKg} kg` : '— (log in Weight tab)'}{s.heightCm != null ? `  •  Height: ${s.heightCm} cm` : ''}</Body>
          </Card>
          <Card>
            <Body>🧘 Yoga today ({s.yogas.length} types)</Body>
            {s.yogas.length === 0 ? <Muted>No yoga checkmarks yet.</Muted> : null}
            {s.yogas.map((y) => (
              <Body key={y.name}>• {y.name} × {y.times} time{y.times > 1 ? 's' : ''}</Body>
            ))}
          </Card>
          <Card>
            <Body>💪 Training today ({s.workouts.length} types)</Body>
            {s.workouts.length === 0 ? <Muted>No workout checkmarks yet.</Muted> : null}
            {s.workouts.map((w) => (
              <Body key={w.name}>✓ {w.name} × {w.times}</Body>
            ))}
          </Card>
          <Card><Body>✅ Total checkmarks: {s.totalDone}</Body></Card>
          <Card><Muted>{buildShareText(s)}</Muted></Card>
        </>
      )}
      <ActionCard title="Load today" desc="Refresh my summary" icon="refresh-outline" onPress={load} />
      <ActionCard title="Share my day" desc="Weight + yoga × times" icon="share-social-outline" onPress={share} />
          <BottomSpace />
    </ScrollView><BottomNav /></View>
  );
}
