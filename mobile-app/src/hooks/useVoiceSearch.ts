import { useCallback, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface UseVoiceSearchOptions {
  /** Called with the transcript as it's recognized — interim results included, so it updates live while speaking. */
  onResult: (transcript: string) => void;
}

/**
 * Tap-to-speak search input (Screen 6, My Stories). One utterance per tap:
 * start() begins listening, the device auto-stops after a pause, and the
 * final transcript lands in onResult — same code path as typing, so a
 * spoken search behaves exactly like a typed one downstream.
 */
export function useVoiceSearch({ onResult }: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      onResult(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    // "no-speech" just means the elder tapped the mic and didn't say
    // anything — not worth surfacing as an error.
    if (event.error !== 'no-speech') {
      setError("Couldn't hear that — please try again.");
    }
  });

  const start = useCallback(async () => {
    setError(null);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone access is needed to search by voice.');
      return;
    }

    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true });
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { isListening, error, start, stop };
}

export default useVoiceSearch;
