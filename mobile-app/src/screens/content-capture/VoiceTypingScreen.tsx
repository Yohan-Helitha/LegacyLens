import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { RoundIconButton } from '../../components/common';
import {
  ContentCaptureTopBar,
  MicOrb,
  TranscriptBox,
  RecordingActionButtons,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useSpeechStrings } from '../../hooks/useSpeechStrings';
import type { SpeechQualityHint } from '../../types/speech';
import { Typography, Spacing, Radii } from '../../theme';
import { useTranslation } from 'react-i18next';

interface VoiceTypingScreenProps {
  onClose?: () => void;
  onFinish?: (transcript: string) => void;
}

/**
 * Speak-to-write capture — the transcript *is* the content (no separate
 * media file for a written story). Turn-based: tap the orb, speak up to
 * 30s, tap again (or let it auto-stop), wait briefly, the transcript grows
 * by that turn, then it's ready for another tap. Backed by useVoiceInput
 * (record-then-transcribe via the backend's Azure-based endpoint) rather
 * than live on-device dictation — there's no text appearing while the
 * elder is still speaking, only once a turn finishes uploading.
 */
export const VoiceTypingScreen: React.FC<VoiceTypingScreenProps> = ({ onClose, onFinish }) => {
  const { t } = useTranslation('contentCapture');
  const speechStrings = useSpeechStrings();
  const [transcript, setTranscript] = useState('');
  /** Survives the hook's own auto-reset to idle after a turn — cleared on the next tap. */
  const [lastQualityHint, setLastQualityHint] = useState<SpeechQualityHint | null>(null);

  const {
    state,
    secondsLeft,
    showCountdownWarning,
    result,
    errorKind,
    errorMessage,
    start,
    stop,
    cancel,
    retry,
    retryUpload,
  } = useVoiceInput();

  useEffect(() => {
    start();
    // Intentionally runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insertedForResultRef = useRef<typeof result>(null);
  useEffect(() => {
    if (!result || insertedForResultRef.current === result) return;
    insertedForResultRef.current = result;

    if (result.qualityHint !== 'NO_SPEECH_DETECTED') {
      setTranscript((prev) => (prev && !prev.endsWith(' ') ? `${prev} ${result.text}` : `${prev}${result.text}`));
    }
    setLastQualityHint(result.qualityHint);
    if (result.qualityHint === 'OK') {
      retry(); // back to idle, ready for the next turn — a notice stays up for the other hints.
    }
    // retry intentionally excluded — this must run only when `result` itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleOrbPress = () => {
    setLastQualityHint(null);
    if (state === 'idle' || state === 'error') start();
    else if (state === 'recording') stop();
  };

  const handleCancelTurn = () => {
    setLastQualityHint(null);
    cancel();
  };

  const handleStartOver = () => {
    cancel();
    setLastQualityHint(null);
    setTranscript('');
  };

  const handleFinish = () => {
    cancel();
    onFinish?.(transcript);
  };

  const handleNoticeRetry = () => {
    setLastQualityHint(null);
    retry();
  };

  const isBusy = state === 'requestingPermission' || state === 'preparing' || state === 'uploading';

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ContentCaptureTopBar left="close" onLeftPress={onClose} />

      <View style={s.content}>
        <Text style={s.instructionText}>{t('voiceTyping.instruction')}</Text>

        <TranscriptBox value={transcript} onChangeText={setTranscript} />

        <View style={s.controlsRow}>
          {state === 'recording' ? (
            <RoundIconButton
              icon={X}
              size={48}
              color={D.onSurfaceVariant}
              backgroundColor={D.surfaceContainer}
              onPress={handleCancelTurn}
              accessibilityLabel={t('voiceTyping.cancelAria')}
            />
          ) : (
            <View style={{ width: 48 }} />
          )}
          <MicOrb
            active={state === 'recording'}
            onPress={handleOrbPress}
            accessibilityLabel={state === 'recording' ? speechStrings.recording.accessibilityLabel : speechStrings.idle.accessibilityLabel}
          />
          <View style={{ width: 48 }} />
        </View>

        {state === 'recording' && (
          <Text style={s.statusText} accessibilityLiveRegion="polite">
            {showCountdownWarning ? speechStrings.recording.autoStopWarning(secondsLeft) : speechStrings.recording.label}
          </Text>
        )}

        {isBusy && (
          <View style={s.busyRow}>
            <ActivityIndicator size="small" color={D.primary} />
            <Text style={s.statusText} accessibilityLiveRegion="polite">
              {state === 'uploading' ? speechStrings.uploading.label : speechStrings.preparing.label}
            </Text>
          </View>
        )}

        {state === 'done' && lastQualityHint === 'LOW_CONFIDENCE' && (
          <View style={s.notice}>
            <Text style={s.noticeText}>{speechStrings.lowConfidence.message}</Text>
          </View>
        )}

        {state === 'done' && lastQualityHint === 'NO_SPEECH_DETECTED' && (
          <View style={s.notice}>
            <Text style={s.noticeText}>{speechStrings.noSpeechDetected.message}</Text>
            {speechStrings.noSpeechDetected.tips.map((tip) => (
              <Text key={tip} style={s.tipText}>
                • {tip}
              </Text>
            ))}
            <Pressable onPress={handleNoticeRetry} accessibilityRole="button">
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
            <Pressable onPress={handleNoticeRetry} accessibilityRole="button">
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

        <RecordingActionButtons
          startOverLabel={t('recording.startOver')}
          finishLabel={t('recording.done')}
          onStartOverPress={handleStartOver}
          onFinishPress={handleFinish}
        />
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  content: { flex: 1, padding: Spacing.md, gap: Spacing.lg },

  instructionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },

  statusText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSecondaryContainer,
    textAlign: 'center',
  },
  busyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },

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

export default VoiceTypingScreen;
