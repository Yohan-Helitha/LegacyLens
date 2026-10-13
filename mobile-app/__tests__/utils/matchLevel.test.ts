import { matchLevelLabel, showsMatchBadge } from '../../src/utils/matchLevel';

describe('matchLevel', () => {
  it('words each level', () => {
    expect(matchLevelLabel('EXCELLENT')).toBe('Excellent match');
    expect(matchLevelLabel('STRONG')).toBe('Strong match');
    expect(matchLevelLabel('GOOD_POTENTIAL')).toBe('Good potential');
    expect(matchLevelLabel('WEAK')).toBe('Weak match');
    expect(matchLevelLabel('NOT_RECOMMENDED')).toBe('');
    expect(matchLevelLabel(null)).toBe('');
  });

  it('shows a badge only for a real fit', () => {
    expect(showsMatchBadge(86, 'EXCELLENT')).toBe(true);
    expect(showsMatchBadge(33, 'WEAK')).toBe(true);
    expect(showsMatchBadge(12, 'NOT_RECOMMENDED')).toBe(false);
    expect(showsMatchBadge(null, null)).toBe(false);
    expect(showsMatchBadge(null, 'STRONG')).toBe(false);
  });
});
