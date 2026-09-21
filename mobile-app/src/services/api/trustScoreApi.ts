import { apiGet } from './client';
import { TrustScoreDetail } from '../../types/trustScore';

/** Typed wrapper around GET /api/knowledge-holders/me/trust-score. */
export const trustScoreApi = {
  getMine: () => apiGet<TrustScoreDetail>('/knowledge-holders/me/trust-score'),
};
