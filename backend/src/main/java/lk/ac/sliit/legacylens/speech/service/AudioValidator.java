package lk.ac.sliit.legacylens.speech.service;

import lk.ac.sliit.legacylens.speech.config.SpeechProperties;
import lk.ac.sliit.legacylens.speech.exception.UnsupportedAudioException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * Rejects an unusable upload before a provider call is spent on it. Does
 * NOT attempt to decode audio to measure duration — container formats vary
 * too much to do that reliably; actual duration comes back from the
 * provider instead.
 */
@Component
public class AudioValidator {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac",
            "audio/wav", "audio/x-wav", "audio/wave",
            "audio/mpeg", "audio/mp3",
            "audio/ogg", "audio/opus",
            "audio/webm"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "m4a", "aac", "wav", "mp3", "ogg", "opus", "webm"
    );

    private final SpeechProperties speechProperties;

    public AudioValidator(SpeechProperties speechProperties) {
        this.speechProperties = speechProperties;
    }

    public void validate(MultipartFile audio) {
        if (audio == null || audio.isEmpty()) {
            throw new UnsupportedAudioException("No audio was received. Please record again.");
        }

        if (audio.getSize() > speechProperties.getMaxUploadBytes()) {
            throw new UnsupportedAudioException("That recording is too long. Please keep it under 30 seconds.");
        }

        if (!isAllowedType(audio)) {
            throw new UnsupportedAudioException("That audio format isn't supported.");
        }
    }

    private boolean isAllowedType(MultipartFile audio) {
        String contentType = audio.getContentType();
        if (contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return true;
        }

        String filename = audio.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            return false;
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();

        return ALLOWED_EXTENSIONS.contains(extension);
    }
}
