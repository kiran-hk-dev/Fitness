import { useEffect, useState } from 'react';
import { ScrollView, Alert, View, Text, Switch, StyleSheet } from 'react-native';
import {Card, H1, Body, Muted, ActionCard, DisclaimerBanner, BottomSpace, TopSpace, PageHeader} from '../../src/components/ui';
import { PoseSlideshow } from '../../src/components/ExercisePhoto';
import { ThemePicker } from '../../src/components/ThemePicker';
import { HEALTH_DISCLAIMER } from '../../src/utils/safety';
import { supabase } from '../../src/lib/supabase';
import { requestNotificationPermissions, scheduleDailyReminder, cancelReminder } from '../../src/lib/notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/theme';

const REMINDERS = [
  { id: 'rem-workout', label: '🏋️ Workout', desc: 'Daily 7:00 AM', hour: 7, minute: 0, title: 'Time to move 💪', body: 'Your workout is waiting — even 15 minutes counts.' },
  { id: 'rem-water', label: '💧 Water', desc: 'Daily 10:00 AM', hour: 10, minute: 0, title: 'Drink water 💧', body: 'Top up your bottle and sip through the day.' },
  { id: 'rem-meal', label: '🍛 Meal plan', desc: 'Daily 1:00 PM', hour: 13, minute: 0, title: 'Plan dinner 🍛', body: 'A minute of planning beats an evening of guessing.' },
  { id: 'rem-sleep', label: '😴 Bedtime', desc: 'Daily 10:30 PM', hour: 22, minute: 30, title: 'Wind down 🌙', body: 'Screens off soon — recovery starts tonight.' },
];
const PREF_KEY = 'fitlife360:reminders';

export default function ProfileTab() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then((raw) => {
      if (raw) setPrefs(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const toggle = async (r: (typeof REMINDERS)[number], on: boolean) => {
    if (on) {
      const ok = await requestNotificationPermissions();
      if (!ok) return Alert.alert('Blocked', 'Enable notifications in system settings first.');
      await scheduleDailyReminder(r.id, r.hour, r.minute, r.title, r.body);
    } else {
      await cancelReminder(r.id);
    }
    const next = { ...prefs, [r.id]: on };
    setPrefs(next);
    await AsyncStorage.setItem(PREF_KEY, JSON.stringify(next)).catch(() => {});
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome' as any);
  };
  const exportData = () => Alert.alert('Export', 'CSV/PDF export queued (Supabase query → share sheet).');
  const deleteAccount = () =>
    Alert.alert('Delete account', 'This removes profile + logs via RLS cascade. Confirm in Supabase dashboard Auth admin.', [{ text: 'OK' }]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg, padding: 16 }}>
      <TopSpace />
      <PageHeader title="My Space" subtitle="Settings · theme · reminders" icon="person-outline" />
      <PoseSlideshow poseIds={['child', 'bridge', 'catcow']} height={140} />
      <ThemePicker />
      <Card>
        <Text style={useStyles().secHead}>🔔 Reminders — tap the sliders</Text>
        <Muted>Adaptive: completed goals skip their nudges.</Muted>
        {REMINDERS.map((r) => (
          <View key={r.id} style={useStyles().row}>
            <View style={{ flex: 1 }}>
              <Text style={useStyles().label}>{r.label}</Text>
              <Text style={useStyles().desc}>{r.desc}</Text>
            </View>
            <Switch
              value={!!prefs[r.id]}
              onValueChange={(v) => toggle(r, v)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </Card>
      <Card><Body>Targets • Units (metric/imperial) • Privacy • Equipment</Body></Card>
      <DisclaimerBanner text={HEALTH_DISCLAIMER} />
      <ActionCard title="Export my data" desc="CSV/PDF via share sheet" icon="download-outline" onPress={exportData} />
      <ActionCard title="Delete account" desc="Removes everything (RLS cascade)" icon="trash-outline" accent={Colors.danger} onPress={deleteAccount} />
      <ActionCard title="Logout" desc="See you soon" icon="log-out-outline" onPress={logout} />
      <BottomSpace />
    </ScrollView>
  );
}

const useStyles = () => StyleSheet.create({
  secHead: { color: Colors.text, fontWeight: '800', fontSize: 15, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8 },
  label: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  desc: { color: Colors.muted, fontSize: 12, marginTop: 1 },
});
