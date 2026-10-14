import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same three languages offered on the onboarding Language screen. */
export type AppLocale = 'en' | 'si' | 'ta';

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['en', 'si', 'ta'];

/** Each language written in its own script — the standard way to list languages, so people can find theirs. */
export const LOCALE_NATIVE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  si: 'සිංහල',
  ta: 'தமிழ்',
};

/** Maps whatever the Language screen hands over (or a device locale tag) onto a supported locale. */
export const toAppLocale = (code: string | undefined | null): AppLocale => {
  const base = (code ?? '').toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as AppLocale) : 'en';
};

const detectDeviceLocale = (): AppLocale => {
  try {
    return toAppLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'en';
  }
};

interface LocaleState {
  locale: AppLocale;
  /**
   * True once the elder has picked a language on the onboarding Language screen. The Loading screen only
   * shows that screen to first-time users — everyone else goes straight on to Login.
   */
  hasChosenLanguage: boolean;
  setLocale: (code: string) => void;
}

/** Bump when the persisted shape changes, and handle the old shape in `migrate` below. */
const STORE_VERSION = 1;

/**
 * The elder's chosen display language. Set from the onboarding Language
 * screen; falls back to the device locale until they've chosen. Persisted so
 * the choice survives restarts.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectDeviceLocale(),
      hasChosenLanguage: false,
      setLocale: (code) => set({ locale: toAppLocale(code), hasChosenLanguage: true }),
    }),
    {
      name: 'legacylens-locale',
      storage: createJSONStorage(() => AsyncStorage),
      version: STORE_VERSION,
      // Before version 1 nothing recorded whether a language had been chosen. Anyone who already has a saved
      // locale has used the app before, so they count as returning users and skip the Language screen.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<LocaleState>;
        return version < 1 ? { ...state, hasChosenLanguage: true } : state;
      },
    },
  ),
);
