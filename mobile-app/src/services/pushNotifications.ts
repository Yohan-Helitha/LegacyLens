import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { pushDeviceApi } from './api/pushDeviceApi';

/**
 * Phone notifications (the ones in the notification bar) for the creator side.
 *
 * Everything here is optional on purpose. The notification module is native code: a build of the
 * app made before it was added does not contain it, and a phone without Google services cannot get
 * a token. In either case these functions quietly do nothing - the app itself must never fail
 * because a notification could not be set up.
 */
type NotificationsModule = typeof import('expo-notifications');
type DeviceModule = typeof import('expo-device');

function loadNative(): { Notifications: NotificationsModule; Device: DeviceModule } | null {
  try {
    // Required here, not imported at the top, so a build without the native module cannot crash at start-up.
    return { Notifications: require('expo-notifications'), Device: require('expo-device') };
  } catch {
    return null;
  }
}

/** Asks permission, gets this phone's push token and tells the server about it. Returns the token, or null if it could not be set up. */
export async function registerForPushNotifications(): Promise<string | null> {
  const native = loadNative();
  if (!native) return null;
  const { Notifications, Device } = native;

  // Push tokens only exist on a real phone, not an emulator.
  if (!Device.isDevice) return null;

  try {
    // Show a notification even while the app is open.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Legacy Lens',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

    await pushDeviceApi.register(token, Platform.OS);
    return token;
  } catch (error) {
    // Typically: no Firebase/Google services set up for this build yet. Not an app error.
    console.log('Phone notifications are not available on this build yet:', error instanceof Error ? error.message : error);
    return null;
  }
}

type Listener = (data: Record<string, unknown>) => void;

/** The notification already acted on, so signing in again does not replay the same tap. */
let lastHandledId: string | null = null;

/** Calls back when the user taps a notification, including the one that opened the app. Returns a function that stops listening. */
export function onNotificationTapped(listener: Listener): () => void {
  const native = loadNative();
  if (!native) return () => {};

  try {
    const { Notifications } = native;
    const handle = (response: import('expo-notifications').NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (id === lastHandledId) return;
      lastHandledId = id;
      listener((response.notification.request.content.data ?? {}) as Record<string, unknown>);
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handle);

    // The notification that launched the app from a closed state.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handle(response);
      })
      .catch(() => {});

    return () => subscription.remove();
  } catch {
    return () => {};
  }
}

/** Calls back when a notification arrives while the app is open. Returns a function that stops listening. */
export function onNotificationReceived(listener: () => void): () => void {
  const native = loadNative();
  if (!native) return () => {};

  try {
    const subscription = native.Notifications.addNotificationReceivedListener(() => listener());
    return () => subscription.remove();
  } catch {
    return () => {};
  }
}
