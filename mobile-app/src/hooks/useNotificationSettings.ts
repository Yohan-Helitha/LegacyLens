import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
} from '../services/pushNotifications';
import type { PushStatus } from '../services/pushNotifications';
import { useAuthStore } from '../store/authStore';
import { useNotificationPrefStore } from '../store/notificationPrefStore';

export type NotificationState = 'on' | 'off' | 'blocked' | 'unsupported';
export type NotificationProblem = 'blocked' | 'failed' | 'unsupported' | null;

/**
 * What the Notification settings (Profile) show and do. "On" means all three are true: the build can do
 * notifications, the phone has given permission, and the person has not switched them off in the app.
 * "Blocked" is the phone itself refusing - only the phone's Settings can change that, so the sheet points there.
 * Re-reads the phone's permission whenever the app comes back to the front, because that is where the person
 * returns from after changing it.
 */
export function useNotificationSettings() {
  const userId = useAuthStore((state) => state.user?.userId ?? null);
  const optedIn = useNotificationPrefStore((state) => !userId || !state.disabledUserIds.includes(userId));
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<NotificationProblem>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const latest = await getPushStatus();
    if (mountedRef.current) setStatus(latest);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [refresh]);

  const state: NotificationState = !status
    ? 'off'
    : !status.supported
      ? 'unsupported'
      : status.permission === 'denied' && !status.canAskAgain
        ? 'blocked'
        : status.permission === 'granted' && optedIn
          ? 'on'
          : 'off';

  const toggle = useCallback(
    async (next: boolean) => {
      if (busy) return;
      setBusy(true);
      setProblem(null);
      try {
        if (next) {
          const result = await enablePushNotifications();
          if (result !== 'enabled') setProblem(result);
        } else if (!(await disablePushNotifications())) {
          setProblem('failed');
        }
        await refresh();
      } finally {
        if (mountedRef.current) setBusy(false);
      }
    },
    [busy, refresh],
  );

  return { state, busy, problem, toggle, refresh };
}

export default useNotificationSettings;
