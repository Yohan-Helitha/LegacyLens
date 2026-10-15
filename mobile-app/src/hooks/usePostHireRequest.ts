import { useCallback, useState } from 'react';
import { hireRequestApi } from '../services/api/hireRequestApi';

type SubmitErrorKey =
  | 'post.error.titleRequired'
  | 'post.error.descriptionRequired'
  | 'post.error.acknowledgeRequired'
  | 'post.error.submitFailed';

export interface HireRequestVoiceNote {
  uri: string;
  durationMillis: number;
}

/**
 * Submit logic for Screen 8 (Request Creator Assistance): a title and a
 * recorded voice note for the details — nothing else. The details are
 * voice-only by design (not transcribed): the admin reviewing a request
 * hears it directly, which catches things a speech-to-text pass can lose.
 * Where and how the elder wants the story captured goes in that recording
 * itself, so there is no structured region or format input to validate.
 *
 * Neither `title`, `voiceNote`, nor `acknowledged` (the "I understand the
 * 1-hour deletion window" checkbox) is owned here — all three live in
 * ContentCaptureNavigator, because recording the voice note means leaving
 * this screen entirely (for AudioRecordingScreen) and coming back, which
 * unmounts PostHireRequestScreen and would reset any state kept in a hook
 * instantiated inside it (this bit the title field once already: it used to
 * live in local useState here and got wiped on that same round trip). The
 * caller passes all three in; this hook only reads them for validation and
 * the submit payload.
 */
export function usePostHireRequest(title: string, voiceNote: HireRequestVoiceNote | null, acknowledged: boolean) {
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<SubmitErrorKey | null>(null);

  const clearError = useCallback((key: SubmitErrorKey) => {
    setErrorKey((current) => (current === key ? null : current));
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
    if (!acknowledged) {
      setErrorKey('post.error.acknowledgeRequired');
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
  }, [title, voiceNote, acknowledged]);

  return { submitting, errorKey, clearError, submit };
}

export default usePostHireRequest;
