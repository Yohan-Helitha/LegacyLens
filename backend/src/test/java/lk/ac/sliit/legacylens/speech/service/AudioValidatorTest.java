package lk.ac.sliit.legacylens.speech.service;

import lk.ac.sliit.legacylens.speech.config.SpeechProperties;
import lk.ac.sliit.legacylens.speech.exception.UnsupportedAudioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AudioValidatorTest {

    private AudioValidator audioValidator;

    @BeforeEach
    void setUp() {
        SpeechProperties speechProperties = new SpeechProperties();
        speechProperties.setMaxUploadBytes(10);

        audioValidator = new AudioValidator(speechProperties);
    }

    @Test
    void validate_emptyFile_throws() {
        MockMultipartFile empty = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[0]);

        assertThrows(UnsupportedAudioException.class, () -> audioValidator.validate(empty));
    }

    @Test
    void validate_nullFile_throws() {
        assertThrows(UnsupportedAudioException.class, () -> audioValidator.validate(null));
    }

    @Test
    void validate_oversizeFile_throws() {
        MockMultipartFile oversize = new MockMultipartFile(
                "audio", "clip.m4a", "audio/m4a", new byte[]{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11});

        assertThrows(UnsupportedAudioException.class, () -> audioValidator.validate(oversize));
    }

    @Test
    void validate_disallowedType_throws() {
        MockMultipartFile wrongType = new MockMultipartFile(
                "audio", "clip.exe", "application/octet-stream", new byte[]{1, 2, 3});

        assertThrows(UnsupportedAudioException.class, () -> audioValidator.validate(wrongType));
    }

    @Test
    void validate_validType_doesNotThrow() {
        MockMultipartFile valid = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[]{1, 2, 3});

        assertThatCode(() -> audioValidator.validate(valid)).doesNotThrowAnyException();
    }

    @Test
    void validate_validExtensionButUnknownContentType_doesNotThrow() {
        // Some clients send application/octet-stream with a correct extension — the extension allow-list covers this.
        MockMultipartFile valid = new MockMultipartFile(
                "audio", "clip.wav", "application/octet-stream", new byte[]{1, 2, 3});

        assertThatCode(() -> audioValidator.validate(valid)).doesNotThrowAnyException();
    }
}
