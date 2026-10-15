package lk.ac.sliit.legacylens.translation.provider;

import java.util.List;

/** Something that can machine-translate text — today Google Cloud Translation. Kept behind an interface so tests (and a future provider) don't need Google. */
public interface TranslationProvider {

    /** False when no credentials are configured, so callers can answer "unavailable" instead of failing obscurely. */
    boolean isConfigured();

    /** Translates each text into {@code targetLanguage}; the source language is detected. Same order and size as the input. */
    List<String> translate(List<String> texts, String targetLanguage);
}
