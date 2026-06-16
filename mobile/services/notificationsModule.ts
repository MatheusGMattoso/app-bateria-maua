import type {
  NotificationContentInput,
  NotificationRequestInput,
  NotificationResponse,
} from 'expo-notifications/build/Notifications.types';
import type { EventSubscription } from 'expo-modules-core';
import type {
  NotificationPermissionsStatus,
} from 'expo-notifications/build/NotificationPermissions.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';

export type NotificationsLocalModule = {
  getPermissionsAsync: () => Promise<NotificationPermissionsStatus>;
  requestPermissionsAsync: () => Promise<NotificationPermissionsStatus>;
  scheduleNotificationAsync: (request: NotificationRequestInput) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  addNotificationResponseReceivedListener: (
    listener: (response: NotificationResponse) => void
  ) => EventSubscription;
  SchedulableTriggerInputTypes: typeof SchedulableTriggerInputTypes;
};

let modulePromise: Promise<NotificationsLocalModule | null> | null = null;
let handlerConfigured = false;

/** Imports granulares evitam DevicePushTokenAutoRegistration (push no Expo Go Android). */
export async function loadNotificationsLocal(): Promise<NotificationsLocalModule | null> {
  if (!modulePromise) {
    modulePromise = Promise.all([
      import('expo-notifications/build/NotificationsHandler'),
      import('expo-notifications/build/NotificationPermissions'),
      import('expo-notifications/build/scheduleNotificationAsync'),
      import('expo-notifications/build/cancelScheduledNotificationAsync'),
      import('expo-notifications/build/cancelAllScheduledNotificationsAsync'),
      import('expo-notifications/build/NotificationsEmitter'),
      import('expo-notifications/build/Notifications.types'),
    ])
      .then(
        ([
          handler,
          permissions,
          scheduleMod,
          cancelOneMod,
          cancelAllMod,
          emitter,
          types,
        ]) => {
          if (!handlerConfigured) {
            handler.setNotificationHandler({
              handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
              }),
            });
            handlerConfigured = true;
          }

          return {
            getPermissionsAsync: permissions.getPermissionsAsync,
            requestPermissionsAsync: permissions.requestPermissionsAsync,
            scheduleNotificationAsync: scheduleMod.default,
            cancelScheduledNotificationAsync: cancelOneMod.default,
            cancelAllScheduledNotificationsAsync: cancelAllMod.default,
            addNotificationResponseReceivedListener: emitter.addNotificationResponseReceivedListener,
            SchedulableTriggerInputTypes: types.SchedulableTriggerInputTypes,
          };
        }
      )
      .catch(() => null);
  }

  return modulePromise;
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  const [{ default: setNotificationChannelAsync }, { AndroidImportance }] = await Promise.all([
    import('expo-notifications/build/setNotificationChannelAsync'),
    import('expo-notifications/build/NotificationChannelManager.types'),
  ]);

  await setNotificationChannelAsync('default', {
    name: 'Lembretes da Bateria',
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}
