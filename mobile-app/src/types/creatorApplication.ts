/**
 * Mirrors lk.ac.sliit.legacylens.marketplace.dto.* and
 * lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel — the
 * "Become a Content Creator" application endpoints under
 * /api/creator-applications/**.
 */

export type ExperienceLevel = 'NEW_TO_DOCUMENTATION' | 'SOME_EXPERIENCE' | 'EXPERIENCED';

export type CreatorApplicationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface CreatorApplicationResponse {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  city: string | null;
  nicNumber: string;
  email: string;
  aboutYou: string;
  skills: string;
  interests: string;
  experienceLevel: ExperienceLevel;
  experienceDescription: string;
  proofDocumentUrl: string;
  status: CreatorApplicationStatus;
  submittedAt: string;
}

/** A file picked via expo-image-picker, shaped for FormData's file part. */
export interface CreatorApplicationProofFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Everything the applicant actually fills in. full_name / phone_number /
 * city / nic_number are NOT here — the backend fills those from the
 * authenticated user's own profile (see CreatorApplicationServiceImpl).
 */
export interface SubmitCreatorApplicationRequest {
  email: string;
  aboutYou: string;
  skills: string[];
  interests: string[];
  experienceLevel: ExperienceLevel;
  experienceDescription: string;
  proofDocument: CreatorApplicationProofFile;
}
