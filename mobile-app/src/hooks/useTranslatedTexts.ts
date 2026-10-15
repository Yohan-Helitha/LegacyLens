import { useCallback, useEffect, useMemo, useState } from 'react';
import { translationApi } from '../services/api/translationApi';
import { useLocaleStore, type AppLocale } from '../store/localeStore';
import { needsTranslation } from '../utils/translationHeuristics';

/** Translations already fetched this session, so scrolling back or reopening a screen costs nothing. */
const cache = new Map<string, string>();
/** After the service says "unavailable" or "too many requests", stop asking for a while instead of hammering it. */
let pausedUntil = 0;

const CHUNK_SIZE = 40; // the backend accepts at most 50 texts per request
const PAUSE_MS = 60_000;

const cacheKey = (locale: AppLocale, text: string) => `${locale}\u0000${text}`;

/** Test helper — forgets everything so one test can't leak into the next. */
export function resetTranslationCache(): void {
  cache.clear();
  pausedUntil = 0;
}

interface TranslatedTexts {
  /** Same length and order as the input; the original text whenever there is no translation (yet). */
  texts: string[];
  /** True when at least one text on screen differs from its original — i.e. a "Show original" toggle makes sense. */
  translated: boolean;
  showOriginal: boolean;
  toggleOriginal: () => void;
}

/**
 * Shows user-written content (story text, comments, reviews) in the elder's chosen language. The original text
 * is shown straight away and swapped for the translation when it arrives; if translation isn't available the
 * original simply stays. Text that already looks like it's in the right language is never sent. Translations
 * are fetched from the backend (which holds the Google key and caches every result).
 */
export function useTranslatedTexts(input: (string | null | undefined)[]): TranslatedTexts {
  const locale = useLocaleStore((state) => state.locale);
  const [, bump] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);

  const signature = input.map((text) => text ?? '').join('\u0001');
  const texts = useMemo(() => signature.split('\u0001'), [signature]);

  useEffect(() => {
    if (Date.now() < pausedUntil) return;
    const pending = [...new Set(texts)].filter(
      (text) => needsTranslation(text, locale) && !cache.has(cacheKey(locale, text)),
    );
    if (pending.length === 0) return;

    let cancelled = false;
    (async () => {
      for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
        const chunk = pending.slice(i, i + CHUNK_SIZE);
        try {
          const { translations } = await translationApi.translate(chunk, locale);
          chunk.forEach((text, j) => {
            if (translations[j]) cache.set(cacheKey(locale, text), translations[j]);
          });
          if (!cancelled) bump((n) => n + 1);
        } catch {
          // Unavailable, rate-limited, offline…: keep showing the original, and don't retry for a minute.
          pausedUntil = Date.now() + PAUSE_MS;
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [texts, locale]);

  const toggleOriginal = useCallback(() => setShowOriginal((value) => !value), []);

  const shown = texts.map((text) => (showOriginal ? undefined : cache.get(cacheKey(locale, text))) ?? text);
  const translated = texts.some((text) => {
    const result = cache.get(cacheKey(locale, text));
    return !!result && result !== text;
  });

  return { texts: shown, translated, showOriginal, toggleOriginal };
}

export default useTranslatedTexts;
