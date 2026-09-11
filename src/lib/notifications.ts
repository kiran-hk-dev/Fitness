import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(
  id: string,
  hour: number,
  minute: number,
  title: string,
  body: string
) {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger:
      Platform.OS === 'web'
        ? null
        : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelReminder(id: string) {
  return Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
