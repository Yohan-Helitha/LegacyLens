import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Mic, Search } from 'lucide-react-native';
import { Radii, Spacing, Typography } from '../../../theme';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { ContentCaptureColors as D } from './tokens';

interface VoiceSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** BCP-47 tag sent to the backend for transcription; defaults to the backend's own default (si-LK). */
  voiceLang?: string;
}

/**
 * Search field with a mango-orange microphone inside it — the elder can
 * type, or tap the mic and speak a title or topic instead. Both paths just
 * call onChangeText, so a spoken search behaves exactly like a typed one.
 *
 * Backed by useVoiceInput (record up to 30s, then transcribe via the
 * backend's Azure-based endpoint) — the search box fills in once
 * transcription completes, not live while speaking.
 */
export const VoiceSearchBar: React.FC<VoiceSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search your stories…',
  voiceLang,
}) => {
  const { state, result, errorKind, errorMessage, start, stop, retry } = useVoiceInput({ language: voiceLang });

  const insertedForResultRef = useRef<typeof result>(null);
  useEffect(() => {
    if (!result || insertedForResultRef.current === result) return;
    insertedForResultRef.current = result;

    if (result.qualityHint !== 'NO_SPEECH_DETECTED') {
      onChangeText(result.text);
    }
    retry();
    // onChangeText/retry intentionally excluded — this must run only when `result` itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const busy = state === 'requestingPermission' || state === 'preparing' || state === 'uploading';
  const isRecording = state === 'recording';

  const handleMicPress = () => {
    if (state === 'idle' || state === 'error') start();
    else if (state === 'recording') stop();
  };

  const hint =
    isRecording
      ? 'Listening…'
      : state === 'uploading'
        ? 'Writing it down…'
        : state === 'error'
          ? errorKind === 'permission'
            ? 'Microphone access is needed to search by voice.'
            : errorMessage ?? "Couldn't hear that — please try again."
          : null;

  return (
    <View>
      <View style={[s.wrap, isRecording && s.wrapListening]}>
        <Search size={18} color={D.onSurfaceVariant} strokeWidth={2} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={D.onSurfaceVariant}
          style={s.input}
          returnKeyType="search"
        />
        {busy ? (
          <View style={s.micBtn}>
            <ActivityIndicator size="small" color={D.onSecondaryContainer} />
          </View>
        ) : (
          <Pressable
            onPress={handleMicPress}
            style={({ pressed }) => [s.micBtn, isRecording && s.micBtnActive, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop voice search' : 'Search by speaking'}
          >
            <Mic size={18} color={isRecording ? '#ffffff' : D.onSecondaryContainer} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {!!hint && <Text style={state === 'error' ? s.hintError : s.hint}>{hint}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.full,
    paddingLeft: Spacing.md,
    paddingRight: 6,
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
  },
  wrapListening: { borderColor: D.secondaryContainer, borderWidth: 1.5 },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: D.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: D.secondary },
  pressed: { opacity: 0.85 },

  hint: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: D.onSecondaryContainer,
    marginTop: 6,
    marginLeft: Spacing.md,
  },
  hintError: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.clay,
    marginTop: 6,
    marginLeft: Spacing.md,
  },
});

export default VoiceSearchBar;
