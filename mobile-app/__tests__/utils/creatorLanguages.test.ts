import {
  languageMissingLevel,
  selectionFromLanguages,
  proficiencyLabel,
  setLanguageLevel,
  toggleLanguage,
  toLanguageRequests,
  toWireFormat,
} from '../../src/utils/creatorLanguages';

describe('creatorLanguages', () => {
  it('ticking a language adds it without a level, ticking again removes it', () => {
    const ticked = toggleLanguage({}, 'Sinhala');
    expect(ticked).toEqual({ Sinhala: null });

    const withLevel = setLanguageLevel(ticked, 'Sinhala', 'FLUENT');
    expect(toggleLanguage(withLevel, 'Sinhala')).toEqual({});
  });

  it('asks for the level of a ticked language that has none', () => {
    const selection = setLanguageLevel(toggleLanguage(toggleLanguage({}, 'Tamil'), 'English'), 'English', 'BASIC');

    expect(languageMissingLevel(selection)).toBe('Tamil');
    expect(languageMissingLevel(setLanguageLevel(selection, 'Tamil', 'INTERMEDIATE'))).toBeNull();
    expect(languageMissingLevel({})).toBeNull();
  });

  it('sends only languages with a level, in the form order', () => {
    let selection = toggleLanguage({}, 'English');
    selection = setLanguageLevel(selection, 'English', 'BASIC');
    selection = setLanguageLevel(toggleLanguage(selection, 'Sinhala'), 'Sinhala', 'FLUENT');
    selection = toggleLanguage(selection, 'Tamil'); // ticked, no level yet

    expect(toLanguageRequests(selection)).toEqual([
      { language: 'Sinhala', proficiency: 'FLUENT' },
      { language: 'English', proficiency: 'BASIC' },
    ]);
  });

  it('writes each language the way the server reads it', () => {
    expect(toWireFormat([
      { language: 'Sinhala', proficiency: 'FLUENT' },
      { language: 'English', proficiency: 'BASIC' },
    ])).toEqual(['Sinhala:FLUENT', 'English:BASIC']);
  });

  it('has a readable label for every level', () => {
    expect(proficiencyLabel('BASIC')).toBe('Basic');
    expect(proficiencyLabel('INTERMEDIATE')).toBe('Intermediate');
    expect(proficiencyLabel('FLUENT')).toBe('Fluent');
    expect(proficiencyLabel(null)).toBe('');
  });

  it('turns saved languages back into the picker state, and back to the wire format unchanged', () => {
    const selection = selectionFromLanguages([
      { language: 'Sinhala', proficiency: 'FLUENT' },
      { language: 'English', proficiency: 'BASIC' },
    ]);

    expect(selection).toEqual({ Sinhala: 'FLUENT', English: 'BASIC' });
    expect(toWireFormat(toLanguageRequests(selection))).toEqual(['Sinhala:FLUENT', 'English:BASIC']);
    expect(selectionFromLanguages([])).toEqual({});
  });
});
