import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { messagingApi } from '../services/api/messagingApi';
import { usePushNotificationEvents } from '../hooks/usePushNotifications';
import { useAuthStore } from './authStore';

/** Asking again sooner than this is skipped, so moving between screens does not fire a request each time. */
const MIN_GAP_MS = 8000;

/**
 * How many messages from other people the signed-in person has not read yet, across all their chats - the red
 * number on the Inbox tab. One copy for the whole app; it comes from the backend and is never made up.
 */
interface InboxUnreadState {
  /** Whose number this is, so another login never sees it. */
  userId: string | null;
  count: number;
  lastAskedAt: number;
  /** Reads the number from the backend. `force` skips the "asked a moment ago" check. */
  refresh: (force?: boolean) => Promise<void>;
  reset: () => void;
}

export const useInboxUnreadStore = create<InboxUnreadState>()((set, get) => ({
  userId: null,
  count: 0,
  lastAskedAt: 0,

  refresh: async (force = false) => {
    const userId = useAuthStore.getState().user?.userId ?? null;
    if (!userId) return;
    if (!force && get().userId === userId && Date.now() - get().lastAskedAt < MIN_GAP_MS) return;
    set({ lastAskedAt: Date.now() });
    try {
      const count = await messagingApi.unreadCount();
      // Ignore a late answer that belongs to someone who has since logged out or switched.
      if (useAuthStore.getState().user?.userId === userId) set({ userId, count });
    } catch {
      // Not fatal: the number stays as it was until the next attempt.
    }
  },

  reset: () => set({ userId: null, count: 0, lastAskedAt: 0 }),
}));

/**
 * The Inbox tab's unread number for the signed-in person. Refreshes when the tab is first shown, and again
 * whenever a notification arrives (a new message is exactly what that is usually about).
 */
export function useInboxUnread(): number {
  const signedInId = useAuthStore((s) => s.user?.userId ?? null);
  const { userId, count, refresh, reset } = useInboxUnreadStore();

  useEffect(() => {
    if (!signedInId) {
      if (userId) reset();
      return;
    }
    if (userId && userId !== signedInId) reset();
    refresh();
  }, [signedInId]); // eslint-disable-line react-hooks/exhaustive-deps -- only when who is signed in changes

  const onArrived = useCallback(() => {
    refresh(true);
  }, [refresh]);
  usePushNotificationEvents({ onReceived: onArrived });

  return userId === signedInId ? count : 0;
}
