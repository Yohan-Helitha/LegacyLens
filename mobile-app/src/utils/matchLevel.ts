import type { MatchLevel } from '../types/opportunity';

const LABELS: Record<MatchLevel, string> = {
  EXCELLENT: 'Excellent match',
  STRONG: 'Strong match',
  GOOD_POTENTIAL: 'Good potential',
  WEAK: 'Weak match',
  NOT_RECOMMENDED: '',
};

/** The words shown beside a match percentage; empty for a level that should not be shown at all. */
export function matchLevelLabel(level: MatchLevel | null | undefined): string {
  return level ? LABELS[level] : '';
}

/** A percentage badge is only worth showing when the opportunity is a real fit (30% or more). */
export function showsMatchBadge(percentage: number | null | undefined, level: MatchLevel | null | undefined): boolean {
  return percentage != null && !!level && level !== 'NOT_RECOMMENDED';
}
