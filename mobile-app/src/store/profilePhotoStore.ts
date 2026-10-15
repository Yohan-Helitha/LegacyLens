import { useEffect } from 'react';
import { create } from 'zustand';
import { profileApi } from '../services/api/profileApi';
import { resolveImageUrl } from '../constants/api';
import { useAuthStore } from './authStore';

/**
 * The signed-in person's own profile picture - one copy, shared by every screen that shows it (the dashboard
 * greeting, the bottom bar's profile icon, the profile page), so they can never disagree. It comes from the
 * backend (the account's profile photo); there is no made-up picture, and no picture means each screen falls
 * back to its plain placeholder.
 */
interface ProfilePhotoState {
  /** Whose picture this is, so another login never sees it. */
  userId: string | null;
  /** The picture as the backend stored it (a path or a full address), or null when none was set. */
  photoUrl: string | null;
  loaded: boolean;
  loading: boolean;
  /** Reads the picture from the backend. */
  refresh: () => Promise<void>;
  /** Used straight after a new picture is uploaded, so every screen shows it at once. */
  setPhotoUrl: (photoUrl: string | null) => void;
  reset: () => void;
}

export const useProfilePhotoStore = create<ProfilePhotoState>()((set, get) => ({
  userId: null,
  photoUrl: null,
  loaded: false,
  loading: false,

  refresh: async () => {
    const userId = useAuthStore.getState().user?.userId ?? null;
    if (!userId || get().loading) return;
    set({ loading: true });
    try {
      const profile = await profileApi.getMe();
      // Ignore a late answer that belongs to someone who has since logged out or switched.
      if (useAuthStore.getState().user?.userId === userId) {
        set({ userId, photoUrl: profile.profilePhotoUrl ?? null, loaded: true });
      }
    } catch {
      // Not fatal: the placeholder stays until the next attempt.
    } finally {
      set({ loading: false });
    }
  },

  setPhotoUrl: (photoUrl) =>
    set({ userId: useAuthStore.getState().user?.userId ?? null, photoUrl, loaded: true }),

  reset: () => set({ userId: null, photoUrl: null, loaded: false, loading: false }),
}));

/**
 * The signed-in person's profile picture, ready to show (a full address) or null when they have none.
 * Loads it from the backend the first time it is needed for this account.
 */
export function useProfilePhoto(): string | null {
  const signedInId = useAuthStore((s) => s.user?.userId ?? null);
  const { userId, photoUrl, loaded, loading, refresh, reset } = useProfilePhotoStore();

  useEffect(() => {
    if (!signedInId) {
      if (userId) reset();
      return;
    }
    if (userId && userId !== signedInId) {
      reset();
      return;
    }
    if (!loaded && !loading) refresh();
  }, [signedInId, userId, loaded, loading, refresh, reset]);

  return userId === signedInId ? resolveImageUrl(photoUrl) : null;
}
