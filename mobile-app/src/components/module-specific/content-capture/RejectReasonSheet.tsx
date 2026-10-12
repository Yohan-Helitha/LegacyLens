import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoundIconButton } from '../../common';
import { useHireStrings } from '../../../hooks/useHireStrings';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { MicInputField } from './MicInputField';
import { ContentCaptureColors as D } from './tokens';

interface RejectReasonSheetProps {
  visible: boolean;
  /** True while the decline request is in flight — locks every control so it can't be sent twice. */
  submitting?: boolean;
  /** Shown above the buttons when the last attempt failed — the typed note is kept so retrying is one tap. */
  errorText?: string;
  /** Dismissed without declining anyone (backdrop tap, close button, Android back). */
  onClose: () => void;
  /** Decline with no note attached. */
  onSkip: () => void;
  /** Decline with the elder's note. Only reachable once text has been entered. */
  onSend: (reason: string) => void;
}

/**
 * Bottom sheet shown after "Reject". Explaining a decline is optional and
 * the copy says so plainly: "Skip" is the same size and weight as "Send"
 * (a muted-outline vs deep-teal-fill pair, not a primary and an
 * afterthought), and Send simply stays inactive until there's text to send.
 */
export const RejectReasonSheet: React.FC<RejectReasonSheetProps> = ({
  visible,
  submitting = false,
  errorText,
  onClose,
  onSkip,
  onSend,
}) => {
  const { t, speechLang, voiceLabels } = useHireStrings();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');

  // Never carry a half-written note over to the next applicant.
  useEffect(() => {
    if (!visible) setReason('');
  }, [visible]);

  const canSend = reason.trim().length > 0 && !submitting;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={s.root} behavior="padding">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('reject.close')}
          importantForAccessibility="no"
        >
          <View style={s.backdrop} />
        </Pressable>

        <View style={[s.sheet, { paddingBottom: insets.bottom + Spacing.md }]} accessibilityViewIsModal>
          <View style={s.handle} />

          <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={s.content}>
            <View style={s.titleRow}>
              <Text style={s.title} accessibilityRole="header">
                {t('reject.title')}
              </Text>
              <RoundIconButton
                icon={X}
                size={44}
                color={D.onSurfaceVariant}
                onPress={onClose}
                accessibilityLabel={t('reject.close')}
              />
            </View>

            <Text style={s.reassurance}>{t('reject.reassurance')}</Text>

            <MicInputField
              label={t('reject.field')}
              hideLabel
              multiline
              minInputHeight={88}
              value={reason}
              onChangeText={setReason}
              placeholder={t('reject.placeholder')}
              editable={!submitting}
              voiceLang={speechLang}
              voiceLabels={voiceLabels(t('reject.field'))}
            />

            {!!errorText && (
              <Text style={s.errorText} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                {errorText}
              </Text>
            )}

            <View style={s.actions}>
              <HireActionButton
                label={t('reject.skip')}
                variant="muted"
                onPress={onSkip}
                disabled={submitting}
                style={s.actionBtn}
              />
              <HireActionButton
                label={submitting ? t('reject.sending') : t('reject.send')}
                onPress={() => onSend(reason.trim())}
                disabled={!canSend}
                style={s.actionBtn}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '90%',
    paddingTop: Spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: D.outlineVariant,
    marginBottom: Spacing.xs,
  },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  title: {
    flex: 1,
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 34,
    color: D.onSurface,
  },
  reassurance: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurfaceVariant,
    marginTop: -Spacing.xs,
  },
  errorText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: '#ba1a1a',
  },
  // Equal-width siblings: neither button is bigger, so neither reads as the "right" answer.
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionBtn: { flexGrow: 1, flexBasis: 140 },
});

export default RejectReasonSheet;
