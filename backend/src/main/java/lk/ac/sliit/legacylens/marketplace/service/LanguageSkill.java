package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.LanguageProficiency;

/**
 * A language a creator speaks. {@code proficiency} is null when only the
 * language is known - for creators who applied before the form asked how well.
 */
public record LanguageSkill(String language, LanguageProficiency proficiency) {
}
