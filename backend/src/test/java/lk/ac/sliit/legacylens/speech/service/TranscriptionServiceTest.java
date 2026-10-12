package lk.ac.sliit.legacylens.speech.service;

import lk.ac.sliit.legacylens.speech.config.SpeechProperties;
import lk.ac.sliit.legacylens.speech.dto.QualityHint;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResponse;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;
import lk.ac.sliit.legacylens.speech.exception.ProviderNotFoundException;
import lk.ac.sliit.legacylens.speech.provider.SpeechToTextProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TranscriptionServiceTest {

    private FakeSpeechProvider azureFake;
    private SpeechProperties speechProperties;
    private TranscriptionService transcriptionService;

    @BeforeEach
    void setUp() {
        azureFake = new FakeSpeechProvider("azure");
        speechProperties = new SpeechProperties();
        speechProperties.setActiveProvider("azure");
        speechProperties.setDefaultLanguage("si-LK");
        speechProperties.setMaxUploadBytes(5 * 1024 * 1024);
        speechProperties.setLowConfidenceThreshold(0.60);

        List<SpeechToTextProvider> providers = List.of(azureFake);
        transcriptionService = new TranscriptionService(
                providers, new AudioValidator(speechProperties), new QualityAssessor(speechProperties), speechProperties);
    }

    @Test
    void transcribe_picksTheConfiguredProvider_andReturnsItsResult() {
        azureFake.willReturn(TranscriptionResult.builder()
                .providerName("azure")
                .text("mama kataa karanawa")
                .confidence(0.92)
                .languageCode("si-LK")
                .latencyMs(120)
                .audioDurationMs(3000L)
                .firstPhraseOffsetMs(200L)
                .phraseCount(1)
                .build());
        MockMultipartFile audio = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[]{1, 2, 3});

        TranscriptionResponse response = transcriptionService.transcribe(audio, null);

        assertThat(response.getProviderName()).isEqualTo("azure");
        assertThat(response.getText()).isEqualTo("mama kataa karanawa");
        assertThat(response.getQualityHint()).isEqualTo(QualityHint.OK);
    }

    @Test
    void transcribe_noLanguageOverride_usesConfiguredDefault() {
        azureFake.willReturn(TranscriptionResult.builder().text("hi").phraseCount(1).confidence(0.9).build());
        MockMultipartFile audio = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[]{1, 2, 3});

        transcriptionService.transcribe(audio, null);

        assertThat(azureFake.getLastOptions().getLanguageCode()).isEqualTo("si-LK");
    }

    @Test
    void transcribe_languageOverride_isPassedThrough() {
        azureFake.willReturn(TranscriptionResult.builder().text("hi").phraseCount(1).confidence(0.9).build());
        MockMultipartFile audio = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[]{1, 2, 3});

        transcriptionService.transcribe(audio, "en-US");

        assertThat(azureFake.getLastOptions().getLanguageCode()).isEqualTo("en-US");
    }

    @Test
    void transcribe_lowConfidenceResult_flagsLowConfidenceHint() {
        azureFake.willReturn(TranscriptionResult.builder().text("hi").phraseCount(1).confidence(0.1).build());
        MockMultipartFile audio = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[]{1, 2, 3});

        TranscriptionResponse response = transcriptionService.transcribe(audio, null);

        assertThat(response.getQualityHint()).isEqualTo(QualityHint.LOW_CONFIDENCE);
    }

    @Test
    void transcribe_unknownActiveProvider_throwsProviderNotFound() {
        speechProperties.setActiveProvider("does-not-exist");
        MockMultipartFile audio = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[]{1, 2, 3});

        assertThrows(ProviderNotFoundException.class, () -> transcriptionService.transcribe(audio, null));
    }

    @Test
    void transcribe_unusableUpload_neverReachesTheProvider() {
        MockMultipartFile empty = new MockMultipartFile("audio", "clip.m4a", "audio/m4a", new byte[0]);

        try {
            transcriptionService.transcribe(empty, null);
        } catch (Exception expected) {
            // AudioValidatorTest covers the exact exception — here we only care the provider was never called.
        }

        assertThat(azureFake.getLastAudio()).isNull();
    }
}
