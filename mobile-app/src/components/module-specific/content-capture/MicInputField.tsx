import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { ReturnKeyTypeOptions } from 'react-native';
import { Mic } from 'lucide-react-native';
import { RoundIconButton } from '../../common';
import { useVoiceToText } from '../../../hooks/useVoiceToText';
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
  /** BCP-47 tag for dictation (e.g. 'si-LK'); defaults to US English. */
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

/**
 * Standard text input used everywhere text entry happens in this module —
 * Title, Description, and the written-content transcript — with an
 * embedded mic button for voice dictation. Appends each finalized phrase to
 * whatever's already typed, so switching between typing and speaking
 * mid-field works naturally.
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
  // Holds the value as of when dictation started, so an interim result
  // replaces only the in-progress phrase rather than re-appending on every
  // partial update.
  const baseValueRef = useRef(value);
  const labels = voiceLabels ?? DEFAULT_VOICE_LABELS(label);

  const { isListening, errorCode, toggle } = useVoiceToText({
    lang: voiceLang,
    onFinalResult: (text) => {
      const base = baseValueRef.current;
      const next = base && !base.endsWith(' ') ? `${base} ${text}` : `${base}${text}`;
      baseValueRef.current = next;
      onChangeText(next);
    },
    onInterimResult: (text) => {
      const base = baseValueRef.current;
      const joined = base && !base.endsWith(' ') ? `${base} ${text}` : `${base}${text}`;
      onChangeText(joined);
    },
  });

  const handleMicPress = () => {
    if (!isListening) baseValueRef.current = value;
    toggle();
  };

  const fieldAccessibilityLabel = errorText ? `${label}, required, ${errorText}` : label;
  const voiceErrorText =
    !isListening && errorCode
      ? errorCode === 'permission'
        ? labels.permissionError
        : labels.recognitionError
      : undefined;

  return (
    <View style={s.section}>
      {!hideLabel && <Text style={s.sectionLabel}>{label}</Text>}

      <View
        style={[
          s.fieldWrap,
          multiline && s.fieldWrapMultiline,
          isListening && s.fieldWrapListening,
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

        {editable && (
          <RoundIconButton
            icon={Mic}
            size={40}
            iconSize={18}
            color={isListening ? D.onPrimary : D.onSecondaryContainer}
            backgroundColor={isListening ? D.secondary : D.secondaryContainer}
            onPress={handleMicPress}
            accessibilityLabel={isListening ? labels.stop : labels.start}
          />
        )}
      </View>

      {isListening && (
        <Text style={s.listeningText} accessibilityLiveRegion="polite">
          {labels.listening}
        </Text>
      )}
      {!!errorText && <Text style={s.errorText}>{errorText}</Text>}
      {!!voiceErrorText && <Text style={s.errorText}>{voiceErrorText}</Text>}
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
