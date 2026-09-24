import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundIconButton } from '../../common';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useHireStrings } from '../../../hooks/useHireStrings';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { MicOrb } from './MicOrb';
import { ContentCaptureColors as D } from './tokens';

export interface VoiceReplyClip {
  uri: string;
  durationMillis: number;
}

interface VoiceReplySheetProps {
  visible: boolean;
  /** Who the reply is for — shown under the title so the elder knows which applicant this is. */
  applicantName: string;
  onClose: () => void;
  onSave: (clip: VoiceReplyClip) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Bottom sheet for a quick spoken reply to one applicant, before the elder
 * decides anything. One big mic to start/stop, then "Record again" or "Save
 * reply" — it never commits an approve or reject.
 */
export const VoiceReplySheet: React.FC<VoiceReplySheetProps> = ({ visible, applicantName, onClose, onSave }) => {
  const { t } = useHireStrings();
  const insets = useSafeAreaInsets();
  const { state, elapsedMs, start, stop } = useAudioRecorder();
  const [clip, setClip] = useState<VoiceReplyClip | null>(null);
  const isRecording = state === 'recording';

  // Never carry a half-finished take over to the next applicant.
  useEffect(() => {
    if (!visible) setClip(null);
  }, [visible]);

  const handleMicPress = async () => {
    if (isRecording) {
      const result = await stop();
      if (result) setClip(result);
      return;
    }
    setClip(null);
    await start();
  };

  const handleClose = async () => {
    if (isRecording) await stop().catch(() => undefined);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={s.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('voice.close')}
          importantForAccessibility="no"
        >
          <View style={s.backdrop} />
        </Pressable>

        <View style={[s.sheet, { paddingBottom: insets.bottom + Spacing.md }]} accessibilityViewIsModal>
          <View style={s.handle} />

          <View style={s.titleRow}>
            <View style={s.titleText}>
              <Text style={s.title} accessibilityRole="header">
                {t('voice.title')}
              </Text>
              <Text style={s.applicant} numberOfLines={1}>
                {applicantName}
              </Text>
            </View>
            <RoundIconButton
              icon={X}
              size={44}
              color={D.onSurfaceVariant}
              onPress={handleClose}
              accessibilityLabel={t('voice.close')}
            />
          </View>

          <Text style={s.hint}>{t('voice.hint')}</Text>

          {clip ? (
            <View style={s.stage}>
              <Text style={s.recordedText} accessibilityLiveRegion="polite">
                {t('voice.recorded', { duration: formatDuration(clip.durationMillis) })}
              </Text>
              <View style={s.actions}>
                <HireActionButton
                  label={t('voice.recordAgain')}
                  variant="muted"
                  onPress={() => {
                    setClip(null);
                    start();
                  }}
                  style={s.actionBtn}
                />
                <HireActionButton label={t('voice.save')} onPress={() => onSave(clip)} style={s.actionBtn} />
              </View>
            </View>
          ) : (
            <View style={s.stage}>
              <MicOrb
                active={isRecording}
                onPress={handleMicPress}
                accessibilityLabel={isRecording ? t('voice.stop') : t('voice.start')}
              />
              <Text style={s.timer} accessibilityLiveRegion="polite">
                {isRecording ? `${t('voice.recording')} ${formatDuration(elapsedMs)}` : ' '}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(24,28,30,0.55)' },
  sheet: {
    backgroundColor: D.surfaceContainerLowest,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: D.outlineVariant,
    marginBottom: Spacing.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  titleText: { flex: 1, gap: 2 },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 34,
    color: D.onSurface,
  },
  applicant: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
  },
  hint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurfaceVariant,
    marginTop: -Spacing.xs,
  },
  stage: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  timer: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.primary,
    minHeight: 24,
  },
  recordedText: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignSelf: 'stretch' },
  actionBtn: { flexGrow: 1, flexBasis: 140 },
});

export default VoiceReplySheet;
