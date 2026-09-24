import { useCallback, useState } from 'react';
import { hireRequestApi } from '../services/api/hireRequestApi';

type SubmitErrorKey =
  | 'post.error.titleRequired'
  | 'post.error.descriptionRequired'
  | 'post.error.submitFailed';

/**
 * State + submit logic for Screen 8 (Request Creator Assistance): a title
 * and free-text details, nothing else. Where and how the elder wants it
 * recorded goes in the details themselves, so there is no structured region
 * or format input to validate.
 */
export function usePostHireRequest() {
  const [title, setTitleState] = useState('');
  const [description, setDescriptionState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<SubmitErrorKey | null>(null);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    setErrorKey((current) => (current === 'post.error.titleRequired' ? null : current));
  }, []);

  const setDescription = useCallback((value: string) => {
    setDescriptionState(value);
    setErrorKey((current) => (current === 'post.error.descriptionRequired' ? null : current));
  }, []);

  /** Resolves true once the request is sent; false on validation or network failure (see `errorKey`). */
  const submit = useCallback(async (): Promise<boolean> => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      setErrorKey('post.error.titleRequired');
      return false;
    }
    if (!trimmedDescription) {
      setErrorKey('post.error.descriptionRequired');
      return false;
    }

    setSubmitting(true);
    setErrorKey(null);
    try {
      await hireRequestApi.submit({
        title: trimmedTitle,
        description: trimmedDescription,
        // The details are always text here — dictation is transcribed on-device by the mic field.
        inputMode: 'TEXT',
      });
      return true;
    } catch {
      setErrorKey('post.error.submitFailed');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [title, description]);

  return { title, setTitle, description, setDescription, submitting, errorKey, submit };
}

export default usePostHireRequest;
