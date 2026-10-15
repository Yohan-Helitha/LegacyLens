jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { toAppLocale, useLocaleStore } from '../../src/store/localeStore';

describe('localeStore', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'en', hasChosenLanguage: false });
  });

  it('starts as a first-time user who has not chosen a language', () => {
    expect(useLocaleStore.getState().hasChosenLanguage).toBe(false);
  });

  it('records the choice when a language is picked, so the Language screen is skipped next time', () => {
    useLocaleStore.getState().setLocale('si');

    expect(useLocaleStore.getState().locale).toBe('si');
    expect(useLocaleStore.getState().hasChosenLanguage).toBe(true);
  });

  it('maps unknown languages to English but still counts as a choice', () => {
    useLocaleStore.getState().setLocale('fr');

    expect(useLocaleStore.getState().locale).toBe('en');
    expect(useLocaleStore.getState().hasChosenLanguage).toBe(true);
  });

  it('treats installs saved before the flag existed as returning users', () => {
    const migrate = useLocaleStore.persist.getOptions().migrate!;

    expect(migrate({ locale: 'ta' }, 0)).toEqual({ locale: 'ta', hasChosenLanguage: true });
  });

  it('leaves already-versioned state alone', () => {
    const migrate = useLocaleStore.persist.getOptions().migrate!;

    expect(migrate({ locale: 'si', hasChosenLanguage: false }, 1)).toEqual({ locale: 'si', hasChosenLanguage: false });
  });

  it('understands region-tagged codes', () => {
    expect(toAppLocale('si-LK')).toBe('si');
    expect(toAppLocale('ta_IN')).toBe('ta');
    expect(toAppLocale(undefined)).toBe('en');
  });
});
