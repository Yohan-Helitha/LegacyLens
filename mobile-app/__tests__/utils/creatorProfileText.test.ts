import { experienceBullets, experienceLabel } from '../../src/utils/creatorProfileText';

describe('creatorProfileText', () => {
  it('labels each experience level', () => {
    expect(experienceLabel('NEW_TO_DOCUMENTATION')).toBe('New to documentation');
    expect(experienceLabel('SOME_EXPERIENCE')).toBe('Some experience');
    expect(experienceLabel('EXPERIENCED')).toBe('Experienced');
    expect(experienceLabel(null)).toBe('');
  });

  it('turns the description into one bullet per line', () => {
    expect(experienceBullets('Cultural event photography\n- Local-language transcription\r\n• Heritage video'))
      .toEqual(['Cultural event photography', 'Local-language transcription', 'Heritage video']);
  });

  it('gives no bullets for blank input', () => {
    expect(experienceBullets(null)).toEqual([]);
    expect(experienceBullets('  \n ')).toEqual([]);
  });
});
