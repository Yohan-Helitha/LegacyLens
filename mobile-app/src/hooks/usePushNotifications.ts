import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  onNotificationReceived,
  onNotificationTapped,
  registerForPushNotifications,
  unregisterThisPhone,
} from '../services/pushNotifications';

/**
 * Registers this phone for notifications once someone is signed in - whoever they are (creator,
 * elder or admin). Mounted once, at the top of the app, so no role has to do it for itself.
 * A phone is tied to whoever signed in on it last.
 */
export function usePushRegistration(): void {
  const token = useAuthStore((state) => state.token);
  const previousToken = useRef<string | null>(null);

  useEffect(() => {
    if (token) {
      registerForPushNotifications();
    } else if (previousToken.current) {
      // Just signed out: stop this phone receiving that user's notifications.
      unregisterThisPhone(previousToken.current);
    }
    previousToken.current = token;
  }, [token]);
}

/**
 * Lets a screen flow react to notifications in its own way: `onTapped` gets the data of the
 * notification the user tapped (to open the right screen), `onReceived` fires when one arrives
 * while the app is open (to refresh whatever it shows). Each role uses this with its own meaning.
 */
export function usePushNotificationEvents(handlers: {
  onTapped?: (data: Record<string, unknown>) => void;
  onReceived?: () => void;
}): void {
  const { onTapped, onReceived } = handlers;

  useEffect(() => {
    const stopTap = onTapped ? onNotificationTapped(onTapped) : () => {};
    const stopReceive = onReceived ? onNotificationReceived(onReceived) : () => {};
    return () => {
      stopTap();
      stopReceive();
    };
  }, [onTapped, onReceived]);
}
