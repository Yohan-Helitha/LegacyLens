package lk.ac.sliit.legacylens.speech.service;

import lk.ac.sliit.legacylens.speech.config.SpeechProperties;
import lk.ac.sliit.legacylens.speech.dto.QualityHint;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;
import org.springframework.stereotype.Component;

/** One job: turn a raw TranscriptionResult into the hint the mobile app shows the elder. */
@Component
public class QualityAssessor {

    private final SpeechProperties speechProperties;

    public QualityAssessor(SpeechProperties speechProperties) {
        this.speechProperties = speechProperties;
    }

    public QualityHint assess(TranscriptionResult result) {
        boolean blankText = result.getText() == null || result.getText().isBlank();
        if (result.getPhraseCount() == 0 || blankText) {
            return QualityHint.NO_SPEECH_DETECTED;
        }

        Double confidence = result.getConfidence();
        if (confidence != null && confidence < speechProperties.getLowConfidenceThreshold()) {
            return QualityHint.LOW_CONFIDENCE;
        }

        return QualityHint.OK;
    }
}
