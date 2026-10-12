import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface UseVoiceToTextOptions {
  /** Called with each finalized chunk of speech — the caller appends it to whatever text it already has. */
  onFinalResult: (text: string) => void;
  /** Called on every partial result while listening, for a live-updating preview. Optional. */
  onInterimResult?: (text: string) => void;
  /** BCP-47 tag for the recogniser (e.g. 'si-LK'). Defaults to US English. */
  lang?: string;
}

/** Machine-readable reason behind `error`, so callers can show localized copy instead of the English default. */
export type VoiceToTextErrorCode = 'permission' | 'recognition';

/**
 * Continuous dictation — unlike useVoiceSearch (one utterance, auto-stops on
 * pause), this keeps listening until the caller stops it, appending each
 * finalized phrase as the elder speaks. Backs both the dedicated Voice
 * Typing screen (the transcript *is* the content) and MicInputField (mic
 * button embedded in any text field).
 */
export function useVoiceToText({ onFinalResult, onInterimResult, lang = 'en-US' }: UseVoiceToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<VoiceToTextErrorCode | null>(null);
  const listeningRef = useRef(false);

  // expo-speech-recognition's events are global: every mounted instance of
  // this hook (e.g. the Title and Description MicInputFields on one form)
  // receives every result, no matter which mic started recognition. Only the
  // instance that called start() may act on them, or speaking into Title
  // also types into Description.
  useSpeechRecognitionEvent('result', (event) => {
    if (!listeningRef.current) return;
    const transcript = event.results[0]?.transcript;
    if (!transcript) return;
    if (event.isFinal) {
      onFinalResult(transcript);
    } else {
      onInterimResult?.(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    listeningRef.current = false;
  });

  useSpeechRecognitionEvent('error', (event) => {
    const wasListening = listeningRef.current;
    setIsListening(false);
    listeningRef.current = false;
    if (wasListening && event.error !== 'no-speech') {
      setError("Couldn't hear that — please try again.");
      setErrorCode('recognition');
    }
  });

  const start = useCallback(async () => {
    setError(null);
    setErrorCode(null);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone access is needed for voice typing.');
      setErrorCode('permission');
      return;
    }

    listeningRef.current = true;
    setIsListening(true);
    AccessibilityInfo.announceForAccessibility('Listening');
    ExpoSpeechRecognitionModule.start({ lang, interimResults: true, continuous: true });
  }, [lang]);

  const stop = useCallback(() => {
    if (!listeningRef.current) return;
    ExpoSpeechRecognitionModule.stop();
    AccessibilityInfo.announceForAccessibility('Stopped listening');
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  return { isListening, error, errorCode, start, stop, toggle };
}

export default useVoiceToText;
