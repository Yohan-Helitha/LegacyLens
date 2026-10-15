import { apiPost } from './client';
import type { AppLocale } from '../../store/localeStore';

interface TranslateResponse {
  /** Same order and size as the texts sent. */
  translations: string[];
}

/**
 * On-demand translation of user-written content (POST /api/translate). The backend holds the Google Cloud key,
 * caches every result and rate-limits per user — the app never sees the key.
 */
export const translationApi = {
  translate: (texts: string[], target: AppLocale) =>
    apiPost<TranslateResponse, { texts: string[]; target: AppLocale }>('/translate', { texts, target }),
};
