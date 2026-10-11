/**
 * English-only copy for the Azure-backed voice capture flow (useVoiceInput /
 * VoiceCaptureField). There's no central i18n system in this app —
 * hireStrings.ts is a trilingual (en/si/ta) pattern, but scoped to the Hire
 * a Creator module only. Per this feature's own ground rules, Sinhala/Tamil
 * copy is not invented here; add it to a proper per-locale dictionary later,
 * the same shape as hireStrings.ts, once native-reviewed translations exist.
 */
export const speechStrings = {
  idle: {
    label: 'Tap to speak',
    accessibilityLabel: 'Tap to speak',
  },
  requestingPermission: {
    label: 'Checking microphone access…',
  },
  permissionDenied: {
    title: 'Microphone access needed',
    body: 'Legacy Lens needs microphone access to turn your voice into text.',
    openSettings: 'Open Settings',
  },
  preparing: {
    label: 'Getting ready…',
  },
  recording: {
    label: 'Listening… tap to finish',
    accessibilityLabel: 'Listening, tap to finish',
    /** Shown for the last 5 seconds before the 30-second auto-stop. */
    autoStopWarning: (secondsLeft: number) => `Finishing in ${secondsLeft}…`,
  },
  tooShort: {
    message: 'That was too short. Please try again.',
    retry: 'Try again',
  },
  uploading: {
    label: 'Writing it down…',
    accessibilityLabel: 'Writing it down, please wait',
  },
  lowConfidence: {
    message: "Please check the words — we're not fully sure we heard you right.",
    retry: 'Try again',
  },
  noSpeechDetected: {
    message: "We couldn't hear anything.",
    tips: ['Find a quiet place', 'Hold the phone close to your mouth', 'Speak slowly'],
    retry: 'Try again',
  },
  networkError: {
    message: "Couldn't reach the server. Check your connection and try again.",
    retry: 'Try again',
  },
  serverError: {
    message: "Something went wrong. We've kept your recording — please try again.",
    retry: 'Try again',
  },
  sessionExpired: {
    message: 'Please sign in again to keep using voice typing.',
  },
};

export default speechStrings;
