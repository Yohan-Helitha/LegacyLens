import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Pause } from 'lucide-react-native';
import { RoundIconButton } from '../../components/common';
import {
  ContentCaptureTopBar,
  MicOrb,
  TranscriptBox,
  RecordingActionButtons,
  ContentCaptureColors as D,
} from '../../components/module-specific/content-capture';
import { useVoiceToText } from '../../hooks/useVoiceToText';
import { Typography, Spacing } from '../../theme';

interface VoiceTypingScreenProps {
  onClose?: () => void;
  onFinish?: (transcript: string) => void;
}

/**
 * Speak-to-write capture — the transcript grows in real time as the elder
 * speaks, and *is* the content (no separate media file for a written
 * story). Listening starts automatically on mount, matching the mic tap
 * that brought the elder here.
 */
export const VoiceTypingScreen: React.FC<VoiceTypingScreenProps> = ({ onClose, onFinish }) => {
  const [transcript, setTranscript] = useState('');

  const { isListening, error, start, stop } = useVoiceToText({
    onFinalResult: (text) => {
      setTranscript((prev) => (prev && !prev.endsWith(' ') ? `${prev} ${text}` : `${prev}${text}`));
    },
  });

  useEffect(() => {
    start();
    // Intentionally runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartOver = () => {
    stop();
    setTranscript('');
  };

  const handleFinish = () => {
    stop();
    onFinish?.(transcript);
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ContentCaptureTopBar left="close" onLeftPress={onClose} />

      <View style={s.content}>
        <Text style={s.instructionText}>
          Press the mic. Start telling your story. We'll write it down for you.
        </Text>

        <TranscriptBox value={transcript} onChangeText={setTranscript} />

        {!!error && <Text style={s.errorText}>{error}</Text>}

        <View style={s.controlsRow}>
          <RoundIconButton
            icon={Pause}
            size={48}
            color={D.onSurfaceVariant}
            backgroundColor={D.surfaceContainer}
            onPress={stop}
            accessibilityLabel="Pause listening"
          />
          <MicOrb
            active={isListening}
            onPress={() => (isListening ? stop() : start())}
            accessibilityLabel={isListening ? 'Listening, tap to pause' : 'Paused, tap to resume'}
          />
          <View style={{ width: 48 }} />
        </View>

        <RecordingActionButtons
          startOverLabel="Start Over"
          finishLabel="Done"
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
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: '#ba1a1a',
    textAlign: 'center',
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
});

export default VoiceTypingScreen;
