import fs from 'fs';
import path from 'path';
import i18n from '../../src/i18n';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const SRC = path.resolve(__dirname, '..', '..', 'src');
const LOCALES = path.join(SRC, 'i18n', 'locales');
const NAMESPACES = ['common', 'contentCapture', 'profile'];
const LANGUAGES = ['si', 'ta'];

type Flat = Record<string, string>;

function flatten(obj: Record<string, unknown>, prefix = '', out: Flat = {}): Flat {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') flatten(v as Record<string, unknown>, `${prefix}${k}.`, out);
    else out[`${prefix}${k}`] = String(v);
  }
  return out;
}

const load = (lang: string, ns: string): Flat =>
  flatten(JSON.parse(fs.readFileSync(path.join(LOCALES, lang, `${ns}.json`), 'utf8')));

const tokens = (s: string, re: RegExp) => (s.match(re) ?? []).sort().join('|');
const PLACEHOLDERS = /\{\{[^}]+\}\}/g;
const TAGS = /<\/?[a-zA-Z][^>]*>/g;

describe('translation catalogs', () => {
  for (const ns of NAMESPACES) {
    const en = load('en', ns);

    for (const lang of LANGUAGES) {
      const translated = load(lang, ns);

      it(`${lang}/${ns} has exactly the same keys as English`, () => {
        expect(Object.keys(translated).sort()).toEqual(Object.keys(en).sort());
      });

      it(`${lang}/${ns} keeps every {{placeholder}} and <tag> from English`, () => {
        const broken = Object.keys(en).filter(
          (k) =>
            tokens(en[k], PLACEHOLDERS) !== tokens(translated[k] ?? '', PLACEHOLDERS) ||
            tokens(en[k], TAGS) !== tokens(translated[k] ?? '', TAGS),
        );
        expect(broken).toEqual([]);
      });

      it(`${lang}/${ns} has no empty or stray-brace values`, () => {
        const bad = Object.keys(translated).filter((k) => {
          const value = translated[k];
          return value.trim() === '' || /[{}]/.test(value.replace(PLACEHOLDERS, ''));
        });
        expect(bad).toEqual([]);
      });
    }
  }
});

describe('translation keys used in the source', () => {
  const known = new Set<string>();
  for (const ns of NAMESPACES) {
    for (const key of Object.keys(load('en', ns))) {
      known.add(key);
      known.add(key.replace(/_(one|other)$/, '')); // plural variants are looked up by their base key
    }
  }

  function sourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === 'i18n' ? [] : sourceFiles(full);
      return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    });
  }

  it('every literal t("...") / i18nKey / labelKey refers to a key that exists in the English catalog', () => {
    const missing: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const text = fs.readFileSync(file, 'utf8');
      const patterns = [
        /\bt\(\s*'([a-zA-Z][\w.]*)'/g,
        /i18n\.t\(\s*'(?:\w+:)?([a-zA-Z][\w.]*)'/g,
        /i18nKey="([\w.]+)"/g,
        /labelKey:\s*'([\w.]+)'/g,
      ];
      for (const re of patterns) {
        for (const match of text.matchAll(re)) {
          // The older Hire a Creator copy (useHireStrings) has its own t() and key space - skip those files.
          if (text.includes('useHireStrings')) continue;
          if (!known.has(match[1])) missing.push(`${path.relative(SRC, file)}: ${match[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('i18n at runtime', () => {
  it('switches the interface language, interpolates, and pluralizes', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('drawer.logOut', { ns: 'contentCapture' })).toBe('Log out');
    expect(i18n.t('stories.greetingSubtitle', { ns: 'contentCapture', count: 1 })).toContain('1 story shared');
    expect(i18n.t('stories.greetingSubtitle', { ns: 'contentCapture', count: 3 })).toContain('3 stories shared');

    await i18n.changeLanguage('si');
    const sinhala = i18n.t('drawer.logOut', { ns: 'contentCapture' });
    expect(sinhala).not.toBe('Log out');
    expect(sinhala).toMatch(/[඀-෿]/); // Sinhala script

    await i18n.changeLanguage('ta');
    expect(i18n.t('drawer.logOut', { ns: 'contentCapture' })).toMatch(/[஀-௿]/); // Tamil script
    expect(i18n.t('stories.greetingTitle', { ns: 'contentCapture', name: 'Nimali' })).toContain('Nimali');

    await i18n.changeLanguage('en');
  });
});
