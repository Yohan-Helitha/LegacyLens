import { isLikelyInLocale, needsTranslation } from '../../src/utils/translationHeuristics';

describe('isLikelyInLocale', () => {
  it('recognises English text', () => {
    expect(isLikelyInLocale('A memory of Avurudu in Kandy', 'en')).toBe(true);
  });

  it('recognises Sinhala and Tamil text for their own locale', () => {
    expect(isLikelyInLocale('අවුරුදු සිරිත් විරිත්', 'si')).toBe(true);
    expect(isLikelyInLocale('தமிழ் புத்தாண்டு நினைவுகள்', 'ta')).toBe(true);
  });

  it('flags text in another language', () => {
    expect(isLikelyInLocale('A memory of Avurudu in Kandy', 'si')).toBe(false);
    expect(isLikelyInLocale('අවුරුදු සිරිත් විරිත්', 'en')).toBe(false);
    expect(isLikelyInLocale('தமிழ் புத்தாண்டு நினைவுகள்', 'si')).toBe(false);
  });

  it('treats mixed text as needing translation into English', () => {
    expect(isLikelyInLocale('Avurudu අවුරුදු', 'en')).toBe(false);
  });

  it('never wastes a call on text with no letters', () => {
    expect(isLikelyInLocale('123 ... :)', 'si')).toBe(true);
    expect(isLikelyInLocale('', 'ta')).toBe(true);
  });
});

describe('needsTranslation', () => {
  it('rejects empty, null and already-matching text', () => {
    expect(needsTranslation(null, 'si')).toBe(false);
    expect(needsTranslation('   ', 'si')).toBe(false);
    expect(needsTranslation('අවුරුදු', 'si')).toBe(false);
  });

  it('accepts text that is in a different language', () => {
    expect(needsTranslation('Lovely story', 'si')).toBe(true);
  });
});
