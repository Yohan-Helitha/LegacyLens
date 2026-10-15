import { useTranslation } from 'react-i18next';

/**
 * Translated copy for the voice capture flow (VoiceTypingScreen, VoiceCaptureField) — same shape the old
 * constants/speechStrings.ts had, now read from the i18n catalog (contentCapture namespace, "speech.*").
 */
export function useSpeechStrings() {
  const { t } = useTranslation('contentCapture');
  return {
    idle: { label: t('speech.idle.label'), accessibilityLabel: t('speech.idle.accessibilityLabel') },
    requestingPermission: { label: t('speech.requestingPermission.label') },
    permissionDenied: {
      title: t('speech.permissionDenied.title'),
      body: t('speech.permissionDenied.body'),
      openSettings: t('speech.permissionDenied.openSettings'),
    },
    preparing: { label: t('speech.preparing.label') },
    recording: {
      label: t('speech.recording.label'),
      accessibilityLabel: t('speech.recording.accessibilityLabel'),
      /** Shown for the last 5 seconds before the 30-second auto-stop. */
      autoStopWarning: (secondsLeft: number) => t('speech.recording.autoStopWarning', { seconds: secondsLeft }),
    },
    tooShort: { message: t('speech.tooShort.message'), retry: t('speech.tooShort.retry') },
    uploading: { label: t('speech.uploading.label'), accessibilityLabel: t('speech.uploading.accessibilityLabel') },
    lowConfidence: { message: t('speech.lowConfidence.message'), retry: t('speech.lowConfidence.retry') },
    noSpeechDetected: {
      message: t('speech.noSpeechDetected.message'),
      tips: [t('speech.noSpeechDetected.tip1'), t('speech.noSpeechDetected.tip2'), t('speech.noSpeechDetected.tip3')],
      retry: t('speech.noSpeechDetected.retry'),
    },
    networkError: { message: t('speech.networkError.message'), retry: t('speech.networkError.retry') },
    serverError: { message: t('speech.serverError.message'), retry: t('speech.serverError.retry') },
    sessionExpired: { message: t('speech.sessionExpired.message') },
  };
}

export default useSpeechStrings;
