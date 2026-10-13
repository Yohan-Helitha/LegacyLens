/** What the mobile app should tell the elder about a transcript — mirrors the backend's QualityHint enum. */
export type SpeechQualityHint = 'OK' | 'LOW_CONFIDENCE' | 'NO_SPEECH_DETECTED';

/** Body of POST /api/speech/transcribe's ApiResponse.data — mirrors the backend's TranscriptionResponse DTO. */
export interface TranscriptionResponse {
  providerName: string;
  text: string;
  confidence: number | null;
  languageCode: string;
  latencyMs: number;
  audioDurationMs: number | null;
  firstPhraseOffsetMs: number | null;
  phraseCount: number;
  qualityHint: SpeechQualityHint;
}
