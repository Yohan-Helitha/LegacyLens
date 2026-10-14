import type { AppLocale } from '../store/localeStore';

const SINHALA = /[඀-෿]/g;
const TAMIL = /[஀-௿]/g;
const LATIN = /[A-Za-z]/g;
const ANY_LETTER = /\p{L}/gu;

const count = (text: string, re: RegExp): number => (text.match(re) ?? []).length;

/**
 * Cheap guess at whether `text` is already written in `locale`, so we don't pay to "translate" it into the
 * language it's in. Errs towards translating: a mixed or unclear text is sent to the backend, which caches
 * the answer, so a wrong guess costs a lookup, never a wrong result.
 */
export function isLikelyInLocale(text: string, locale: AppLocale): boolean {
  const letters = count(text, ANY_LETTER);
  if (letters === 0) return true; // numbers/emoji/punctuation only — nothing to translate

  if (locale === 'si') return count(text, SINHALA) / letters > 0.5;
  if (locale === 'ta') return count(text, TAMIL) / letters > 0.5;
  // English: mostly Latin letters, with no Sinhala or Tamil mixed in.
  return count(text, LATIN) / letters > 0.9 && count(text, SINHALA) + count(text, TAMIL) === 0;
}

/** Whether a text should be sent for translation into `locale`. */
export function needsTranslation(text: string | null | undefined, locale: AppLocale): text is string {
  return !!text && text.trim().length > 0 && !isLikelyInLocale(text, locale);
}
