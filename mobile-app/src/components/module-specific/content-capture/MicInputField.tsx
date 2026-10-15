import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReturnKeyTypeOptions } from 'react-native';
import { Mic } from 'lucide-react-native';
import { RoundIconButton } from '../../common';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import type { SpeechQualityHint } from '../../../types/speech';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

/** Localized copy for the embedded mic — English defaults apply when omitted, so existing callers are unaffected. */
export interface MicInputFieldVoiceLabels {
  /** accessibilityLabel for the idle mic button */
  start: string;
  /** accessibilityLabel while dictation is running */
  stop: string;
  /** Helper line shown while listening */
  listening: string;
  permissionError: string;
  recognitionError: string;
}

interface MicInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  /** Shown as a red-ish helper line under the field, and folded into the field's accessibilityLabel. */
  errorText?: string;
  editable?: boolean;
  /** Keeps `label` as the input's accessibilityLabel but doesn't draw it — for inline fields like a reply bar. */
  hideLabel?: boolean;
  /** BCP-47 tag sent to the backend for transcription (e.g. 'si-LK'); defaults to the backend's own default. */
  voiceLang?: string;
  voiceLabels?: MicInputFieldVoiceLabels;
  maxLength?: number;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  /** Height of the text area for multiline fields. */
  minInputHeight?: number;
}

const DEFAULT_VOICE_LABELS = (label: string): MicInputFieldVoiceLabels => ({
  start: `Voice input for ${label}`,
  stop: `Stop voice input for ${label}`,
  listening: 'Listening…',
  permissionError: 'Microphone access is needed for voice typing.',
  recognitionError: "Couldn't hear that — please try again.",
});

/** One line of helper text for a just-finished turn that doesn't warrant a full notice card in a compact field. */
function qualityHintMessage(hint: SpeechQualityHint): string | null {
  if (hint === 'LOW_CONFIDENCE') return "Please check this — we might not have heard you right.";
  if (hint === 'NO_SPEECH_DETECTED') return "Didn't catch that — tap the mic to try again.";
  return null;
}

/**
 * Standard text input used everywhere text entry happens in this module —
 * Title, Description, and the written-content transcript — with an
 * embedded mic button for voice dictation.
 *
 * Backed by useVoiceInput (record up to 30s, then upload to the backend's
 * Azure-based /api/speech/transcribe) rather than on-device recognition —
 * tap to start, tap again to finish; the transcript appends once transcription
 * completes rather than growing live while speaking. A low-confidence or
 * no-speech turn shows a one-line hint rather than a full notice card, to
 * stay compact; the field returns to idle automatically either way, ready
 * for another tap.
 */
export const MicInputField: React.FC<MicInputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  errorText,
  editable = true,
  hideLabel = false,
  voiceLang,
  voiceLabels,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  minInputHeight,
}) => {
  const labels = voiceLabels ?? DEFAULT_VOICE_LABELS(label);
  const valueRef = useRef(value);
  valueRef.current = value;

  /** Survives the hook's own auto-reset to idle, so the elder still sees it after a turn finishes. Cleared on the next tap. */
  const [lastQualityHint, setLastQualityHint] = useState<SpeechQualityHint | null>(null);

  const { state, result, errorKind, errorMessage, start, stop, retry } = useVoiceInput({ language: voiceLang });

  const insertedForResultRef = useRef<typeof result>(null);
  useEffect(() => {
    if (!result || insertedForResultRef.current === result) return;
    insertedForResultRef.current = result;

    if (result.qualityHint !== 'NO_SPEECH_DETECTED') {
      const base = valueRef.current;
      const next = base && !base.endsWith(' ') ? `${base} ${result.text}` : `${base}${result.text}`;
      onChangeText(next);
    }
    setLastQualityHint(result.qualityHint);
    retry(); // back to idle, ready for another turn — see this component's own doc comment.
    // onChangeText/retry intentionally excluded — this must run only when `result` itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const busy = state === 'requestingPermission' || state === 'preparing' || state === 'uploading';
  const isRecording = state === 'recording';

  const handleMicPress = () => {
    setLastQualityHint(null);
    if (state === 'idle' || state === 'error') start();
    else if (state === 'recording') stop();
  };

  const fieldAccessibilityLabel = errorText ? `${label}, required, ${errorText}` : label;

  const helperMessage =
    state === 'error'
      ? errorKind === 'permission'
        ? labels.permissionError
        : errorMessage ?? labels.recognitionError
      : lastQualityHint
        ? qualityHintMessage(lastQualityHint)
        : null;

  return (
    <View style={s.section}>
      {!hideLabel && <Text style={s.sectionLabel}>{label}</Text>}

      <View
        style={[
          s.fieldWrap,
          multiline && s.fieldWrapMultiline,
          isRecording && s.fieldWrapListening,
          !!errorText && s.fieldWrapError,
        ]}
      >
        <TextInput
          style={[s.input, multiline && s.inputMultiline, multiline && minInputHeight ? { minHeight: minInputHeight } : null]}
          placeholder={placeholder}
          placeholderTextColor={D.onSurfaceVariant}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          editable={editable}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={fieldAccessibilityLabel}
        />

        {editable && busy && (
          <View style={[s.micBtnBusy, { width: 40, height: 40 }]}>
            <ActivityIndicator size="small" color={D.onSecondaryContainer} />
          </View>
        )}

        {editable && !busy && (
          <RoundIconButton
            icon={Mic}
            size={40}
            iconSize={18}
            color={isRecording ? D.onPrimary : D.onSecondaryContainer}
            backgroundColor={isRecording ? D.secondary : D.secondaryContainer}
            onPress={handleMicPress}
            accessibilityLabel={isRecording ? labels.stop : labels.start}
          />
        )}
      </View>

      {isRecording && (
        <Text style={s.listeningText} accessibilityLiveRegion="polite">
          {labels.listening}
        </Text>
      )}
      {state === 'uploading' && (
        <Text style={s.listeningText} accessibilityLiveRegion="polite">
          Writing it down…
        </Text>
      )}
      {!!errorText && <Text style={s.errorText}>{errorText}</Text>}
      {!!helperMessage && <Text style={s.errorText}>{helperMessage}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  section: { gap: Spacing.sm },
  sectionLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },

  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minHeight: 48,
  },
  fieldWrapMultiline: { alignItems: 'flex-end', paddingVertical: Spacing.xs },
  fieldWrapListening: { borderColor: D.secondaryContainer, borderWidth: 1.5 },
  fieldWrapError: { borderColor: '#ba1a1a', borderWidth: 1.5 },

  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 10,
  },
  inputMultiline: { minHeight: 96, flexGrow: 1 },

  micBtnBusy: {
    borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listeningText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: D.onSecondaryContainer,
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: '#ba1a1a',
  },
});

export default MicInputField;
