import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useLocaleStore } from '../store/localeStore';

import enCommon from './locales/en/common.json';
import enContentCapture from './locales/en/contentCapture.json';
import siCommon from './locales/si/common.json';
import siContentCapture from './locales/si/contentCapture.json';
import taCommon from './locales/ta/common.json';
import taContentCapture from './locales/ta/contentCapture.json';
import enProfile from './locales/en/profile.json';
import siProfile from './locales/si/profile.json';
import taProfile from './locales/ta/profile.json';

/**
 * App-wide i18n for fixed interface text (buttons, labels, messages). The language is the elder's choice
 * from the onboarding Language screen, held in useLocaleStore — this just follows it. English is the source
 * of truth and the fallback; si/ta files are machine-translated by scripts/translate-locales.mjs and should
 * be reviewed by a native speaker. (The older Hire a Creator copy still lives in constants/hireStrings.ts.)
 * User-written content (stories, comments) isn't handled here — it is translated on demand by the backend.
 */
export const resources = {
  en: { common: enCommon, contentCapture: enContentCapture, profile: enProfile },
  si: { common: siCommon, contentCapture: siContentCapture, profile: siProfile },
  ta: { common: taCommon, contentCapture: taContentCapture, profile: taProfile },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: useLocaleStore.getState().locale,
  fallbackLng: 'en',
  ns: ['common', 'contentCapture', 'profile'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React Native renders text safely — no HTML escaping needed
  returnNull: false,
});

// The locale store rehydrates from storage asynchronously, and the elder can change language later.
useLocaleStore.subscribe((state) => {
  if (i18n.language !== state.locale) {
    void i18n.changeLanguage(state.locale);
  }
});

export default i18n;
