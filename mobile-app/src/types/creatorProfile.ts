/**
 * Mirrors lk.ac.sliit.legacylens.marketplace.dto.CreatorProfileResponse and
 * friends — the content creator profile endpoints under /api/creators/** and
 * the private document links under /api/creator-proofs/**.
 */

import type { CreatorLanguage } from './creatorApplication';

export type CreatorExperienceLevel = 'NEW_TO_DOCUMENTATION' | 'SOME_EXPERIENCE' | 'EXPERIENCED';

export type CreatorApplicationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/** Filled in only when the creator is viewing their own profile — null for everyone else. */
export interface CreatorOwnerDetails {
  email: string | null;
  phoneNumber: string | null;
  /** The full, unmasked NIC number. */
  nicNumber: string | null;
  applicationStatus: CreatorApplicationStatus | null;
  proofUploaded: boolean;
  /** e.g. "image/jpeg" or "application/pdf". */
  proofContentType: string | null;
}

export interface CreatorContribution {
  jobId: string;
  title: string;
  completedAt: string | null;
}

export interface CreatorProfileData {
  userId: string;
  name: string;
  /** "/uploads/..." path or full URL; null when there is no photo. */
  avatarUrl: string | null;
  city: string | null;
  /** BigDecimal on the server, so it can arrive as a string. */
  rating: number | string | null;
  contributionsCount: number;
  aboutYou: string | null;
  skills: string[];
  languages: CreatorLanguage[];
  interests: string[];
  experienceLevel: CreatorExperienceLevel | null;
  experienceDescription: string | null;
  completedCount: number;
  approvedCount: number;
  activeCount: number;
  previousContributions: CreatorContribution[];
  ownerDetails: CreatorOwnerDetails | null;
}

/** A short-lived address for the creator's own verification document. */
export interface ProofLink {
  /** Root-relative, e.g. "/api/creator-proofs/eyJ..." — prefix with the server address. */
  path: string;
  contentType: string;
  expiresAt: string;
}
