import { useCallback, useMemo } from 'react';
import {
  HIRE_STRINGS,
  LOCALE_DATE_TAG,
  LOCALE_SPEECH_TAG,
  type HireStringKey,
} from '../constants/hireStrings';
import { useLocaleStore, type AppLocale } from '../store/localeStore';
import type { MicInputFieldVoiceLabels } from '../components/module-specific/content-capture/MicInputField';

type Params = Record<string, string | number>;

const pluralCategory = (locale: AppLocale, count: number): 'one' | 'other' => {
  try {
    return new Intl.PluralRules(LOCALE_DATE_TAG[locale]).select(count) === 'one' ? 'one' : 'other';
  } catch {
    return count === 1 ? 'one' : 'other';
  }
};

/**
 * Translation + locale-aware formatting for the Hire a Creator screens.
 * `t('key', { name })` interpolates `{name}` tokens; `t('key', { count })`
 * on a key that has `_one`/`_other` variants picks the right plural form.
 * Missing keys in a non-English locale fall back to English.
 */
export function useHireStrings() {
  const locale = useLocaleStore((state) => state.locale);

  const t = useCallback(
    (key: HireStringKey | string, params?: Params): string => {
      const dictionary = HIRE_STRINGS[locale];
      let template: string | undefined;

      if (params && typeof params.count === 'number') {
        const pluralKey = `${key}_${pluralCategory(locale, params.count)}`;
        template =
          (dictionary as Record<string, string>)[pluralKey] ??
          (HIRE_STRINGS.en as Record<string, string>)[pluralKey];
      }
      template ??=
        (dictionary as Record<string, string>)[key] ?? (HIRE_STRINGS.en as Record<string, string>)[key] ?? key;

      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, token: string) =>
        token in params ? String(params[token]) : match,
      );
    },
    [locale],
  );

  const formatDate = useCallback(
    (iso: string): string => {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return '';
      try {
        return date.toLocaleDateString(LOCALE_DATE_TAG[locale], {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return date.toDateString();
      }
    },
    [locale],
  );

  const formatRating = useCallback(
    (rating: number): string => {
      try {
        return new Intl.NumberFormat(LOCALE_DATE_TAG[locale], {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(rating);
      } catch {
        return rating.toFixed(1);
      }
    },
    [locale],
  );

  /** Localized copy for a MicInputField's embedded mic, named after the field it dictates into. */
  const voiceLabels = useCallback(
    (fieldName: string): MicInputFieldVoiceLabels => ({
      start: t('common.voiceInput', { field: fieldName }),
      stop: t('common.stopVoiceInput', { field: fieldName }),
      listening: t('common.listening'),
      permissionError: t('common.micPermission'),
      recognitionError: t('common.micError'),
    }),
    [t],
  );

  // 'en' deliberately resolves to undefined, not 'en-US': voice input in
  // this app is backed by Azure transcription now (not on-device dictation,
  // which this mapping originally fed), and nothing an elder says into these
  // fields is actually meant to be recognized as English — an elder whose
  // UI happens to be in English still speaks Sinhala or Tamil into the mic.
  // undefined here means MicInputField passes no language override at all,
  // so the backend's own si-LK default applies, same as every mic button
  // elsewhere in the app that never set voiceLang in the first place.
  // Forcing en-US previously made Azure phonetically force-fit Sinhala
  // speech into English-sounding words instead of transcribing it.
  const speechLang = locale === 'en' ? undefined : LOCALE_SPEECH_TAG[locale];

  return useMemo(
    () => ({ t, locale, formatDate, formatRating, voiceLabels, speechLang }),
    [t, locale, formatDate, formatRating, voiceLabels, speechLang],
  );
}

export default useHireStrings;
