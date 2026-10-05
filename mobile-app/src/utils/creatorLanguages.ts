import type { CreatorLanguage, LanguageChoice, LanguageProficiency } from '../types/creatorApplication';

/** The languages offered on the "Become a Content Creator" form - the platform's three onboarding languages. */
export const LANGUAGE_OPTIONS = ['Sinhala', 'Tamil', 'English'] as const;

export const PROFICIENCY_OPTIONS: { value: LanguageProficiency; label: string }[] = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'FLUENT', label: 'Fluent' },
];

/** The form's state: a language is ticked when it is a key, and its level is null until one is chosen. */
export type LanguageSelection = Record<string, LanguageProficiency | null>;

export function proficiencyLabel(level: LanguageProficiency | null | undefined): string {
  return PROFICIENCY_OPTIONS.find((option) => option.value === level)?.label ?? '';
}

/** Ticking a language adds it (no level yet); ticking it again removes it and forgets its level. */
export function toggleLanguage(selection: LanguageSelection, language: string): LanguageSelection {
  if (language in selection) {
    const { [language]: _removed, ...rest } = selection;
    return rest;
  }
  return { ...selection, [language]: null };
}

export function setLanguageLevel(
  selection: LanguageSelection,
  language: string,
  level: LanguageProficiency,
): LanguageSelection {
  return { ...selection, [language]: level };
}

/** The first ticked language that still has no level, so the form can ask for it. */
export function languageMissingLevel(selection: LanguageSelection): string | null {
  return LANGUAGE_OPTIONS.find((language) => language in selection && selection[language] == null) ?? null;
}

/** What is sent to the server, in the order the form lists the languages. Languages without a level are left out. */
export function toLanguageRequests(selection: LanguageSelection): LanguageChoice[] {
  const result: LanguageChoice[] = [];
  for (const language of LANGUAGE_OPTIONS) {
    const level = selection[language];
    if (level) {
      result.push({ language, proficiency: level });
    }
  }
  return result;
}

/**
 * "Sinhala (Fluent)" for display; just "Sinhala" when the level is not known.
 * `levelText` turns a level into its words in the reader's own language.
 */
export function languageWithLevel(
  entry: CreatorLanguage,
  levelText: (level: LanguageProficiency) => string,
): string {
  return entry.proficiency ? `${entry.language} (${levelText(entry.proficiency)})` : entry.language;
}
