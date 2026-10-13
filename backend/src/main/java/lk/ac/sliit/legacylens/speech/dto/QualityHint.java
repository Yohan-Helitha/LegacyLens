package lk.ac.sliit.legacylens.speech.dto;

/**
 * What the mobile app should tell the elder about a transcript, decided by
 * {@link lk.ac.sliit.legacylens.speech.service.QualityAssessor} rather than
 * left for each screen to infer from raw confidence numbers.
 */
public enum QualityHint {
    OK,
    LOW_CONFIDENCE,
    NO_SPEECH_DETECTED
}
