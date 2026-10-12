import { useCallback, useState } from 'react';
import { hireRequestApi } from '../services/api/hireRequestApi';

type SubmitErrorKey =
  | 'post.error.titleRequired'
  | 'post.error.descriptionRequired'
  | 'post.error.submitFailed';

export interface HireRequestVoiceNote {
  uri: string;
  durationMillis: number;
}

/**
 * State + submit logic for Screen 8 (Request Creator Assistance): a title
 * and a recorded voice note for the details — nothing else. The details are
 * voice-only by design (not transcribed): the admin reviewing a request
 * hears it directly, which catches things a speech-to-text pass can lose.
 * Where and how the elder wants the story captured goes in that recording
 * itself, so there is no structured region or format input to validate.
 *
 * `voiceNote` is NOT owned here — it lives in ContentCaptureNavigator,
 * because recording it means leaving this screen entirely (for
 * AudioRecordingScreen) and coming back, which would unmount and reset any
 * state kept in this hook. The caller passes the current clip in; this hook
 * only reads it for validation and the submit payload.
 */
export function usePostHireRequest(voiceNote: HireRequestVoiceNote | null) {
  const [title, setTitleState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<SubmitErrorKey | null>(null);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    setErrorKey((current) => (current === 'post.error.titleRequired' ? null : current));
  }, []);

  /** Resolves true once the request is sent; false on validation or network failure (see `errorKey`). */
  const submit = useCallback(async (): Promise<boolean> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorKey('post.error.titleRequired');
      return false;
    }
    if (!voiceNote) {
      setErrorKey('post.error.descriptionRequired');
      return false;
    }

    setSubmitting(true);
    setErrorKey(null);
    try {
      await hireRequestApi.submit({
        title: trimmedTitle,
        inputMode: 'VOICE',
        voiceNote: { uri: voiceNote.uri, name: 'details.m4a', type: 'audio/m4a' },
      });
      return true;
    } catch {
      setErrorKey('post.error.submitFailed');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [title, voiceNote]);

  return { title, setTitle, submitting, errorKey, submit };
}

export default usePostHireRequest;
