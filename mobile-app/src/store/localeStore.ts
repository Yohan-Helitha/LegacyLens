import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same three languages offered on the onboarding Language screen. */
export type AppLocale = 'en' | 'si' | 'ta';

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['en', 'si', 'ta'];

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
  setLocale: (code: string) => void;
}

/**
 * The elder's chosen display language. Set from the onboarding Language
 * screen; falls back to the device locale until they've chosen. Persisted so
 * the choice survives restarts.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectDeviceLocale(),
      setLocale: (code) => set({ locale: toAppLocale(code) }),
    }),
    {
      name: 'legacylens-locale',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
