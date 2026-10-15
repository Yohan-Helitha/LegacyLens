package lk.ac.sliit.legacylens.translation.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.TranslationUnavailableException;
import lk.ac.sliit.legacylens.translation.config.TranslationProperties;
import lk.ac.sliit.legacylens.translation.entity.TranslationCacheEntry;
import lk.ac.sliit.legacylens.translation.provider.TranslationProvider;
import lk.ac.sliit.legacylens.translation.repository.TranslationCacheRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Translates user-written content (story titles and descriptions, comments, reviews) into one of the app's
 * languages. Every translation is cached by a hash of the source text and the target language, so the same
 * text is only ever sent to (and paid for at) Google once, no matter how many people read it.
 */
@Service
public class TranslationService {

    /** The app's three languages — the only targets accepted. */
    static final Set<String> SUPPORTED_TARGETS = Set.of("en", "si", "ta");

    private final TranslationProvider provider;
    private final TranslationCacheRepository cacheRepository;
    private final TranslationProperties properties;

    public TranslationService(TranslationProvider provider, TranslationCacheRepository cacheRepository, TranslationProperties properties) {
        this.provider = provider;
        this.cacheRepository = cacheRepository;
        this.properties = properties;
    }

    /**
     * @return the translations in the same order and size as {@code texts}. Blank or null entries come back
     *         unchanged (and cost nothing).
     */
    public List<String> translate(List<String> texts, String targetLanguage) {
        String target = normalizeTarget(targetLanguage);
        validate(texts);

        String[] result = new String[texts.size()];
        // hash -> source text, and hash -> every position in the request that has that text (duplicates are sent once)
        Map<String, String> sourceByHash = new LinkedHashMap<>();
        Map<String, List<Integer>> positionsByHash = new HashMap<>();

        for (int i = 0; i < texts.size(); i++) {
            String text = texts.get(i);
            if (text == null || text.isBlank()) {
                result[i] = text == null ? "" : text;
                continue;
            }
            String trimmed = text.trim();
            String hash = hash(trimmed);
            sourceByHash.putIfAbsent(hash, trimmed);
            positionsByHash.computeIfAbsent(hash, h -> new ArrayList<>()).add(i);
        }

        Map<String, String> translatedByHash = new HashMap<>();
        if (!sourceByHash.isEmpty()) {
            for (TranslationCacheEntry entry : cacheRepository.findByTargetLanguageAndSourceHashIn(target, sourceByHash.keySet())) {
                translatedByHash.put(entry.getSourceHash(), entry.getTranslatedText());
            }

            List<String> missHashes = sourceByHash.keySet().stream().filter(h -> !translatedByHash.containsKey(h)).toList();
            if (!missHashes.isEmpty()) {
                if (!provider.isConfigured()) {
                    throw new TranslationUnavailableException("Translation isn't configured on the server yet.");
                }
                List<String> translated = provider.translate(missHashes.stream().map(sourceByHash::get).toList(), target);
                if (translated.size() != missHashes.size()) {
                    throw new TranslationUnavailableException("The translation service returned an unexpected response.");
                }
                for (int i = 0; i < missHashes.size(); i++) {
                    translatedByHash.put(missHashes.get(i), translated.get(i));
                    remember(missHashes.get(i), target, translated.get(i));
                }
            }
        }

        positionsByHash.forEach((hash, positions) -> positions.forEach(p -> result[p] = translatedByHash.get(hash)));
        return List.of(result);
    }

    /** Best effort: a concurrent request may have stored the same translation first, which is fine. */
    private void remember(String hash, String target, String translated) {
        try {
            cacheRepository.save(new TranslationCacheEntry(hash, target, translated));
        } catch (DataIntegrityViolationException ignored) {
            // already cached by another request
        }
    }

    private String normalizeTarget(String targetLanguage) {
        String target = targetLanguage == null ? "" : targetLanguage.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED_TARGETS.contains(target)) {
            throw new InvalidRequestException("Unsupported target language. Use one of: en, si, ta.");
        }
        return target;
    }

    private void validate(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            throw new InvalidRequestException("Provide at least one text to translate.");
        }
        if (texts.size() > properties.getMaxTexts()) {
            throw new InvalidRequestException("Too many texts in one request (maximum " + properties.getMaxTexts() + ").");
        }
        for (String text : texts) {
            if (text != null && text.length() > properties.getMaxCharsPerText()) {
                throw new InvalidRequestException("A text is too long to translate (maximum " + properties.getMaxCharsPerText() + " characters).");
            }
        }
    }

    static String hash(String text) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
