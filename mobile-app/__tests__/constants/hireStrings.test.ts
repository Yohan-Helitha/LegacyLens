import { HIRE_STRINGS } from '../../src/constants/hireStrings';

const tokens = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();

describe('hire strings', () => {
  const enKeys = Object.keys(HIRE_STRINGS.en).sort();

  it.each(['si', 'ta'] as const)('%s defines exactly the same keys as English', (locale) => {
    expect(Object.keys(HIRE_STRINGS[locale]).sort()).toEqual(enKeys);
  });

  it.each(['si', 'ta'] as const)('%s keeps every {placeholder} the English string has', (locale) => {
    for (const key of enKeys) {
      const k = key as keyof typeof HIRE_STRINGS.en;
      expect({ key, tokens: tokens(HIRE_STRINGS[locale][k]) }).toEqual({ key, tokens: tokens(HIRE_STRINGS.en[k]) });
    }
  });

  it('has no empty strings', () => {
    for (const locale of ['en', 'si', 'ta'] as const) {
      for (const [key, value] of Object.entries(HIRE_STRINGS[locale])) {
        expect({ locale, key, empty: value.trim() === '' }).toEqual({ locale, key, empty: false });
      }
    }
  });

  it('provides both plural forms wherever one exists', () => {
    for (const key of enKeys.filter((k) => k.endsWith('_one'))) {
      expect(enKeys).toContain(key.replace(/_one$/, '_other'));
    }
  });
});
