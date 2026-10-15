import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { useSpeechStrings } from '../../../hooks/useSpeechStrings';
import { Typography, Spacing, Radii } from '../../../theme';
import { MicOrb } from './MicOrb';
import { ContentCaptureColors as D } from './tokens';

interface VoiceCaptureFieldProps {
  /** Shown above the orb and folded into its accessibility label, e.g. "Your story". */
  label: string;
  /**
   * Called once per successful turn with the transcribed text — appends
   * (like MicInputField) rather than replaces, so multiple turns build up
   * one long story. Not called when nothing was heard (NO_SPEECH_DETECTED).
   */
  onInsertText: (text: string) => void;
  /** BCP-47 tag sent to the backend; defaults to the backend's own default (si-LK). */
  language?: string;
}

/**
 * Azure-backed "record up to 30s, then transcribe" voice capture — the
 * component form of useVoiceInput. Standalone and not wired into any
 * screen yet: VoiceTypingScreen and MicInputField keep their existing
 * on-device, live-dictation engine (useVoiceToText) untouched. This is
 * deliberately a separate building block for wherever the team decides the
 * slower-but-more-accurate Azure path should actually surface.
 */
export const VoiceCaptureField: React.FC<VoiceCaptureFieldProps> = ({ label, onInsertText, language }) => {
  const speechStrings = useSpeechStrings();
  const { state, secondsLeft, showCountdownWarning, result, errorKind, errorMessage, start, stop, retry, retryUpload } =
    useVoiceInput({ language });

  // Fires once per `result` — inserts the text as soon as a turn finishes
  // (OK or LOW_CONFIDENCE both insert; NO_SPEECH_DETECTED does not), then
  // for a clean OK result returns straight to idle so the elder can speak
  // another turn. A LOW_CONFIDENCE result stays visible with its notice
  // instead, so the elder actually sees it before continuing.
  const insertedForResultRef = useRef<typeof result>(null);
  useEffect(() => {
    if (!result || insertedForResultRef.current === result) return;
    insertedForResultRef.current = result;

    if (result.qualityHint !== 'NO_SPEECH_DETECTED') {
      onInsertText(result.text);
    }
    if (result.qualityHint === 'OK') {
      retry();
    }
    // onInsertText/retry intentionally excluded — this must run only when `result` itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleOrbPress = () => {
    if (state === 'idle' || state === 'error') start();
    else if (state === 'recording') stop();
  };

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>

      <View style={s.orbRow}>
        <MicOrb
          active={state === 'recording'}
          onPress={handleOrbPress}
          accessibilityLabel={
            state === 'recording' ? speechStrings.recording.accessibilityLabel : speechStrings.idle.accessibilityLabel
          }
        />

        <View style={s.statusCol}>
          {state === 'idle' && <Text style={s.statusText}>{speechStrings.idle.label}</Text>}
          {state === 'requestingPermission' && <Text style={s.statusText}>{speechStrings.requestingPermission.label}</Text>}
          {state === 'preparing' && <Text style={s.statusText}>{speechStrings.preparing.label}</Text>}

          {state === 'recording' && (
            <>
              <Text style={s.statusTextActive} accessibilityLiveRegion="polite">
                {speechStrings.recording.label}
              </Text>
              {showCountdownWarning && (
                <Text style={s.countdownText}>{speechStrings.recording.autoStopWarning(secondsLeft)}</Text>
              )}
            </>
          )}

          {state === 'uploading' && (
            <View style={s.uploadingRow}>
              <ActivityIndicator size="small" color={D.primary} />
              <Text style={s.statusText} accessibilityLiveRegion="polite">
                {speechStrings.uploading.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      {state === 'done' && result?.qualityHint === 'LOW_CONFIDENCE' && (
        <View style={s.notice}>
          <Text style={s.noticeText}>{speechStrings.lowConfidence.message}</Text>
          <Pressable onPress={retry} accessibilityRole="button">
            <Text style={s.retryText}>{speechStrings.lowConfidence.retry}</Text>
          </Pressable>
        </View>
      )}

      {state === 'done' && result?.qualityHint === 'NO_SPEECH_DETECTED' && (
        <View style={s.notice}>
          <Text style={s.noticeText}>{speechStrings.noSpeechDetected.message}</Text>
          {speechStrings.noSpeechDetected.tips.map((tip) => (
            <Text key={tip} style={s.tipText}>
              • {tip}
            </Text>
          ))}
          <Pressable onPress={retry} accessibilityRole="button">
            <Text style={s.retryText}>{speechStrings.noSpeechDetected.retry}</Text>
          </Pressable>
        </View>
      )}

      {state === 'error' && errorKind === 'permission' && (
        <View style={s.notice}>
          <Text style={s.noticeTitle}>{speechStrings.permissionDenied.title}</Text>
          <Text style={s.noticeText}>{speechStrings.permissionDenied.body}</Text>
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button">
            <Text style={s.retryText}>{speechStrings.permissionDenied.openSettings}</Text>
          </Pressable>
        </View>
      )}

      {state === 'error' && errorKind === 'tooShort' && (
        <View style={s.notice}>
          <Text style={s.noticeText}>{speechStrings.tooShort.message}</Text>
          <Pressable onPress={retry} accessibilityRole="button">
            <Text style={s.retryText}>{speechStrings.tooShort.retry}</Text>
          </Pressable>
        </View>
      )}

      {state === 'error' && (errorKind === 'network' || errorKind === 'server' || errorKind === 'unknown') && (
        <View style={s.notice}>
          <Text style={s.noticeText}>{errorMessage ?? speechStrings.serverError.message}</Text>
          <Pressable onPress={retryUpload} accessibilityRole="button">
            <Text style={s.retryText}>{speechStrings.serverError.retry}</Text>
          </Pressable>
        </View>
      )}

      {state === 'error' && errorKind === 'unauthorized' && (
        <View style={s.notice}>
          <Text style={s.noticeText}>{speechStrings.sessionExpired.message}</Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  label: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },

  orbRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusCol: { flex: 1, gap: 2 },
  statusText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  statusTextActive: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSecondaryContainer },
  countdownText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ba1a1a' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },

  notice: {
    gap: Spacing.xs,
    backgroundColor: D.surfaceContainer,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  noticeTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  noticeText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, lineHeight: 20 },
  tipText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  retryText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.onSecondaryContainer,
    marginTop: Spacing.xs,
  },
});

export default VoiceCaptureField;
