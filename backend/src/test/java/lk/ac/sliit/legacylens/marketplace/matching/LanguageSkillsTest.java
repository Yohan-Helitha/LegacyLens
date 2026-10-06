package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.marketplace.entity.LanguageProficiency;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LanguageSkillsTest {

    @Test
    void submittedEntries_areReadWithTheirLevels() {
        List<LanguageSkill> skills = LanguageSkills.parseSubmitted(List.of("Sinhala:FLUENT", "english:basic"));

        assertThat(skills).containsExactly(
                new LanguageSkill("Sinhala", LanguageProficiency.FLUENT),
                new LanguageSkill("English", LanguageProficiency.BASIC));
    }

    @Test
    void submittedEntries_mustNotBeEmpty() {
        assertThrows(InvalidRequestException.class, () -> LanguageSkills.parseSubmitted(List.of()));
        assertThrows(InvalidRequestException.class, () -> LanguageSkills.parseSubmitted(null));
    }

    @Test
    void aLanguageWithoutALevel_isRejected() {
        assertThrows(InvalidRequestException.class, () -> LanguageSkills.parseSubmitted(List.of("Sinhala")));
        assertThrows(InvalidRequestException.class, () -> LanguageSkills.parseSubmitted(List.of("Sinhala:")));
    }

    @Test
    void anUnknownLanguageOrLevel_isRejected() {
        assertThrows(InvalidRequestException.class, () -> LanguageSkills.parseSubmitted(List.of("French:FLUENT")));
        assertThrows(InvalidRequestException.class, () -> LanguageSkills.parseSubmitted(List.of("Sinhala:NATIVE")));
    }

    @Test
    void theSameLanguageTwice_isRejected() {
        assertThrows(InvalidRequestException.class,
                () -> LanguageSkills.parseSubmitted(List.of("Sinhala:FLUENT", "Sinhala:BASIC")));
    }

    @Test
    void whatIsStored_readsBackExactly() {
        List<LanguageSkill> skills = LanguageSkills.parseSubmitted(List.of("Tamil:INTERMEDIATE", "Sinhala:FLUENT"));

        String stored = LanguageSkills.serialize(skills);

        assertThat(stored).isEqualTo("Tamil:INTERMEDIATE,Sinhala:FLUENT");
        assertThat(LanguageSkills.deserialize(stored)).isEqualTo(skills);
    }

    @Test
    void anOlderApplicationWithNoLanguages_readsAsEmpty() {
        assertThat(LanguageSkills.deserialize(null)).isEmpty();
        assertThat(LanguageSkills.deserialize("  ")).isEmpty();
    }

    @Test
    void aStoredLanguageWithoutAReadableLevel_isNotCounted() {
        assertThat(LanguageSkills.deserialize("Sinhala:???,Tamil,English:BASIC"))
                .containsExactly(new LanguageSkill("English", LanguageProficiency.BASIC));
    }
}
