import type { CreatorExperienceLevel } from '../types/creatorProfile';

const EXPERIENCE_LABELS: Record<CreatorExperienceLevel, string> = {
  NEW_TO_DOCUMENTATION: 'New to documentation',
  SOME_EXPERIENCE: 'Some experience',
  EXPERIENCED: 'Experienced',
};

/** The words shown beside "Experience" for the level the creator chose on their application. */
export function experienceLabel(level: CreatorExperienceLevel | null | undefined): string {
  return level ? EXPERIENCE_LABELS[level] ?? '' : '';
}

/**
 * The creator's free-text experience description, one bullet per line
 * (leading "-", "•" or "*" markers are dropped). Blank input gives no bullets.
 */
export function experienceBullets(description: string | null | undefined): string[] {
  if (!description) return [];
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]+\s*/, '').trim())
    .filter((line) => line.length > 0);
}
