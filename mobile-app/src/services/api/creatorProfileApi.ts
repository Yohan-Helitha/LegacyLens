import { apiGet, apiPost } from './client';
import type { CreatorProfileData, ProofLink } from '../../types/creatorProfile';

/** Typed wrappers around /api/creators/** and /api/creator-proofs/**. */
export const creatorProfileApi = {
  /** The signed-in creator's own page — includes their private details. */
  getMine: () => apiGet<CreatorProfileData>('/creators/me/profile'),

  /** Another creator's page — never includes contact details, NIC or documents. */
  getById: (userId: string) => apiGet<CreatorProfileData>(`/creators/${userId}/profile`),

  /** A link, valid for a few minutes, to the signed-in creator's own verification document. */
  createProofLink: () => apiPost<ProofLink, Record<string, never>>('/creator-proofs/link', {}),
};
