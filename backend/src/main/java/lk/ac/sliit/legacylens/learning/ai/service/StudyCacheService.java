package lk.ac.sliit.legacylens.learning.ai.service;

import lk.ac.sliit.legacylens.learning.ai.prompt.PromptOptions;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedStudySet;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StudyCacheService {

	private final Map<String, GeneratedStudySet> cache = new ConcurrentHashMap<>();

	public String computeCacheKey(List<String> sourceIds, PromptOptions options, int promptVersion) {
		List<String> sortedIds = sourceIds != null ? new ArrayList<>(sourceIds) : new ArrayList<>();
		StringBuilder rawKeyBuilder = new StringBuilder();
		String rawKey = null;
		String hash = null;

		Collections.sort(sortedIds);
		rawKeyBuilder.append("v:").append(promptVersion)
				.append("|sources:").append(String.join(",", sortedIds))
				.append("|quiz:").append(options != null && options.isIncludeQuiz())
				.append("|flashcards:").append(options != null && options.isIncludeFlashcards())
				.append("|course:").append(options != null && options.isIncludeMiniCourse())
				.append("|cert:").append(options != null && options.isIncludeCertificate());

		rawKey = rawKeyBuilder.toString();
		hash = sha256(rawKey);

		return hash;
	}

	public Optional<GeneratedStudySet> get(String cacheKey) {
		GeneratedStudySet item = null;

		if (cacheKey == null || cacheKey.isBlank()) {
			return Optional.empty();
		}

		item = cache.get(cacheKey);

		return Optional.ofNullable(item);
	}

	public void put(String cacheKey, GeneratedStudySet studySet) {
		if (cacheKey != null && !cacheKey.isBlank() && studySet != null) {
			cache.put(cacheKey, studySet);
		}
	}

	public void clear() {
		cache.clear();
	}

	private String sha256(String input) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
			StringBuilder hex = new StringBuilder();

			for (byte b : hashBytes) {
				hex.append(String.format("%02x", b));
			}

			return hex.toString();
		} catch (NoSuchAlgorithmException e) {
			return Integer.toHexString(input.hashCode());
		}
	}
}
