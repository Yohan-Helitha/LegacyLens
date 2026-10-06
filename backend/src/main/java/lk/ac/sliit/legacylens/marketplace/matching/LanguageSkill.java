package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.LanguageProficiency;

/** A language a creator says they speak, and how well. */
public record LanguageSkill(String language, LanguageProficiency proficiency) {
}
