import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { pushDeviceApi } from './api/pushDeviceApi';
import { useAuthStore } from '../store/authStore';
import { isForUser } from '../utils/notificationOwner';
import { isNotificationsEnabledFor, useNotificationPrefStore } from '../store/notificationPrefStore';

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

/**
 * Whether this build of the app contains the native code for notifications. Asked of the native
 * side directly - without loading the notification packages - because in a development build a
 * package that fails to load is reported as a fatal red-screen error before any try/catch can
 * catch it. Only when this says yes are the packages loaded at all.
 */
function nativeSupportPresent(): boolean {
  try {
    return (
      requireOptionalNativeModule('ExpoPushTokenManager') != null &&
      requireOptionalNativeModule('ExpoDevice') != null
    );
  } catch {
    return false;
  }
}

let cachedNative: { Notifications: NotificationsModule; Device: DeviceModule } | null | undefined;

function loadNative(): { Notifications: NotificationsModule; Device: DeviceModule } | null {
  if (cachedNative !== undefined) return cachedNative;
  if (!nativeSupportPresent()) {
    cachedNative = null;
    return cachedNative;
  }
  try {
    // Required here, not imported at the top, so a build without the native module cannot crash at start-up.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy require, see comment above
    cachedNative = { Notifications: require('expo-notifications'), Device: require('expo-device') };
  } catch {
    cachedNative = null;
  }
  return cachedNative;
}

/** The token this phone last registered, kept so it can be removed again on log-out. */
let registeredPushToken: string | null = null;

/**
 * Stops this phone receiving the signed-out user's notifications. Called with the session token the
 * user had just before logging out, because by then the app itself no longer holds one.
 */
export async function unregisterThisPhone(sessionToken: string): Promise<void> {
  const pushToken = registeredPushToken;
  if (!pushToken) return;
  registeredPushToken = null;
  try {
    await pushDeviceApi.unregister(pushToken, sessionToken);
  } catch {
    // Best effort: the phone also drops notifications that are not for whoever is signed in.
  }
}

/**
 * Asks permission, gets this phone's push token and tells the server about it. Returns the token, or null if it
 * could not be set up - or if the person switched notifications off in Notification settings (`force` is for
 * the moment they switch them back on).
 */
export async function registerForPushNotifications(force = false): Promise<string | null> {
  if (!force && !isNotificationsEnabledFor(useAuthStore.getState().user?.userId)) return null;
  const native = loadNative();
  if (!native) return null;
  const { Notifications, Device } = native;

  // Push tokens only exist on a real phone, not an emulator.
  if (!Device.isDevice) return null;

  try {
    // Show a notification even while the app is open.
    // Show a notification even while the app is open - but only to the person it is for. On a phone
    // shared by two people, or after a log-out, someone else's notification is dropped silently.
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const userId = useAuthStore.getState().user?.userId;
        // Only the person it is for, and only if they have not turned notifications off in the app.
        const mine =
          isForUser(notification.request.content.data as Record<string, unknown>, userId) &&
          isNotificationsEnabledFor(userId);
        return {
          shouldShowBanner: mine,
          shouldShowList: mine,
          shouldPlaySound: mine,
          shouldSetBadge: false,
        };
      },
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
    registeredPushToken = token;
    return token;
  } catch (error) {
    // Typically: no Firebase/Google services set up for this build yet. Not an app error.
    console.log('Phone notifications are not available on this build yet:', error instanceof Error ? error.message : error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification settings (Profile) - allow or block notifications on this phone
// ─────────────────────────────────────────────────────────────────────────────

/** What the phone itself says about this app's notifications (Android/iOS settings), plus whether the build can do them at all. */
export interface PushStatus {
  /** False on an emulator, or a build made without the notification module - nothing can be switched on there. */
  supported: boolean;
  permission: 'granted' | 'denied' | 'undetermined';
  /** False once the person has refused and the phone will not ask again: only the phone's own Settings can change it. */
  canAskAgain: boolean;
}

export type EnableResult = 'enabled' | 'blocked' | 'unsupported' | 'failed';

export async function getPushStatus(): Promise<PushStatus> {
  const native = loadNative();
  if (!native || !native.Device.isDevice) return { supported: false, permission: 'undetermined', canAskAgain: false };
  try {
    const { status, canAskAgain } = await native.Notifications.getPermissionsAsync();
    return {
      supported: true,
      permission: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined',
      canAskAgain: canAskAgain ?? true,
    };
  } catch {
    return { supported: false, permission: 'undetermined', canAskAgain: false };
  }
}

/**
 * Switches notifications on: asks the phone for permission if it still can, registers this phone with the
 * server, and only then records the choice - so the setting never says "on" when nothing was set up.
 * 'blocked' means the phone itself refuses them (the person must change that in the phone's Settings).
 */
export async function enablePushNotifications(): Promise<EnableResult> {
  const status = await getPushStatus();
  if (!status.supported) return 'unsupported';

  let permission = status.permission;
  if (permission !== 'granted') {
    if (!status.canAskAgain) return 'blocked';
    try {
      const asked = await loadNative()?.Notifications.requestPermissionsAsync();
      permission = asked?.status === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'failed';
    }
    if (permission !== 'granted') return 'blocked';
  }

  const token = await registerForPushNotifications(true);
  if (!token) return 'failed';

  const userId = useAuthStore.getState().user?.userId;
  if (userId) useNotificationPrefStore.getState().setEnabled(userId, true);
  return 'enabled';
}

/**
 * Switches notifications off: removes this phone from the server so nothing more is sent to it, and only then
 * records the choice. Returns false (and leaves the setting on) if the server could not be reached.
 */
export async function disablePushNotifications(): Promise<boolean> {
  const { user, token: sessionToken } = useAuthStore.getState();
  if (!user || !sessionToken) return false;

  try {
    let pushToken = registeredPushToken;
    if (!pushToken) {
      // After an app restart the token is not held in memory; ask for it again (it is the same one).
      const native = loadNative();
      if (native && native.Device.isDevice) {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        pushToken = (await native.Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
      }
    }
    if (pushToken) await pushDeviceApi.unregister(pushToken, sessionToken);
    registeredPushToken = null;
  } catch {
    return false;
  }

  useNotificationPrefStore.getState().setEnabled(user.userId, false);
  return true;
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
      const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
      // Someone else's notification (shared phone) must not steer this person's app.
      if (!isForUser(data, useAuthStore.getState().user?.userId)) return;
      lastHandledId = id;
      listener(data);
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
