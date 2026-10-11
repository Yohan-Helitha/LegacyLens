package lk.ac.sliit.legacylens.speech.service;

import lk.ac.sliit.legacylens.speech.config.SpeechProperties;
import lk.ac.sliit.legacylens.speech.dto.QualityHint;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QualityAssessorTest {

    private QualityAssessor qualityAssessor;

    @BeforeEach
    void setUp() {
        SpeechProperties speechProperties = new SpeechProperties();
        speechProperties.setLowConfidenceThreshold(0.60);

        qualityAssessor = new QualityAssessor(speechProperties);
    }

    @Test
    void assess_zeroPhrases_isNoSpeechDetected() {
        TranscriptionResult result = TranscriptionResult.builder()
                .text("")
                .phraseCount(0)
                .confidence(null)
                .build();

        assertThat(qualityAssessor.assess(result)).isEqualTo(QualityHint.NO_SPEECH_DETECTED);
    }

    @Test
    void assess_blankTextDespitePhraseCount_isNoSpeechDetected() {
        TranscriptionResult result = TranscriptionResult.builder()
                .text("   ")
                .phraseCount(1)
                .confidence(0.9)
                .build();

        assertThat(qualityAssessor.assess(result)).isEqualTo(QualityHint.NO_SPEECH_DETECTED);
    }

    @Test
    void assess_confidenceJustBelowThreshold_isLowConfidence() {
        TranscriptionResult result = TranscriptionResult.builder()
                .text("mama kataa karanawa")
                .phraseCount(1)
                .confidence(0.59)
                .build();

        assertThat(qualityAssessor.assess(result)).isEqualTo(QualityHint.LOW_CONFIDENCE);
    }

    @Test
    void assess_confidenceJustAboveThreshold_isOk() {
        TranscriptionResult result = TranscriptionResult.builder()
                .text("mama kataa karanawa")
                .phraseCount(1)
                .confidence(0.61)
                .build();

        assertThat(qualityAssessor.assess(result)).isEqualTo(QualityHint.OK);
    }

    @Test
    void assess_nullConfidenceWithSpeech_isOk() {
        // Azure didn't return a confidence figure but did detect phrases — nothing to flag.
        TranscriptionResult result = TranscriptionResult.builder()
                .text("mama kataa karanawa")
                .phraseCount(1)
                .confidence(null)
                .build();

        assertThat(qualityAssessor.assess(result)).isEqualTo(QualityHint.OK);
    }
}
