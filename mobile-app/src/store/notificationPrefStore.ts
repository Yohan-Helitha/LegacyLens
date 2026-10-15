import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Who has switched phone notifications off in the app's own Notification settings. Kept per person, so on a
 * phone two people share, one turning them off does not silence the other. Notifications are on by default:
 * only people listed here are opted out. (The phone's own permission is separate - see pushNotifications.ts.)
 */
interface NotificationPrefState {
  disabledUserIds: string[];
  setEnabled: (userId: string, enabled: boolean) => void;
}

export const useNotificationPrefStore = create<NotificationPrefState>()(
  persist(
    (set) => ({
      disabledUserIds: [],
      setEnabled: (userId, enabled) =>
        set((state) => {
          const others = state.disabledUserIds.filter((id) => id !== userId);
          return { disabledUserIds: enabled ? others : [...others, userId] };
        }),
    }),
    { name: 'legacylens-notification-prefs', storage: createJSONStorage(() => AsyncStorage), version: 1 },
  ),
);

/** Whether this person has not opted out. Anyone not signed in counts as enabled (nothing to suppress). */
export const isNotificationsEnabledFor = (userId: string | null | undefined): boolean =>
  !userId || !useNotificationPrefStore.getState().disabledUserIds.includes(userId);
