/**
 * Mirrors lk.ac.sliit.legacylens.marketplace.dto.* and
 * lk.ac.sliit.legacylens.marketplace.entity.ExperienceLevel — the
 * "Become a Content Creator" application endpoints under
 * /api/creator-applications/**.
 */

export type ExperienceLevel = 'NEW_TO_DOCUMENTATION' | 'SOME_EXPERIENCE' | 'EXPERIENCED';

export type LanguageProficiency = 'BASIC' | 'INTERMEDIATE' | 'FLUENT';

/** A language the applicant ticked on the form, with the level they chose. */
export interface LanguageChoice {
  language: string;
  proficiency: LanguageProficiency;
}

/** A language the creator says they speak, and how well. */
export interface CreatorLanguage {
  language: string;
  proficiency: LanguageProficiency;
}

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
  languages: CreatorLanguage[];
  experienceLevel: ExperienceLevel;
  experienceDescription: string;
  /** Whether a verification document is on file. The document itself is private. */
  proofUploaded: boolean;
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
  /** Every language the applicant speaks, each with a level. */
  languages: LanguageChoice[];
  experienceLevel: ExperienceLevel;
  experienceDescription: string;
  proofDocument: CreatorApplicationProofFile;
}
