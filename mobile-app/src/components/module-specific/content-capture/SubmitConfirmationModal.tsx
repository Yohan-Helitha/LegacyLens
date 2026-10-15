import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Trans } from 'react-i18next';
import { Typography, Spacing, Radii, Colors } from '../../../theme';
import { Checkbox } from './Checkbox';
import { ContentCaptureColors as D } from './tokens';
import { useTranslation } from 'react-i18next';

interface SubmitConfirmationModalProps {
  visible: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * "Are you sure?" gate before a story becomes uneditable. Both checkboxes
 * must be ticked before Submit is enabled — Terms & Conditions content
 * doesn't exist yet (placeholder alert), but the checkbox/link itself is
 * fully functional so the flow isn't blocked once real legal copy lands.
 */
export const SubmitConfirmationModal: React.FC<SubmitConfirmationModalProps> = ({
  visible,
  submitting = false,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation('contentCapture');
  const [accuracyChecked, setAccuracyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const canSubmit = accuracyChecked && termsChecked && !submitting;

  const handleCancel = () => {
    setAccuracyChecked(false);
    setTermsChecked(false);
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleCancel}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
        <View style={s.card} accessibilityViewIsModal accessibilityLiveRegion="polite">
          <Text style={s.title} accessibilityRole="header">
            {t('submit.title')}
          </Text>
          <Text style={s.body}>
            {t('submit.body')}
          </Text>

          <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <Checkbox checked={accuracyChecked} onToggle={() => setAccuracyChecked((v) => !v)}>
              {t('submit.confirmAccurate')}
            </Checkbox>

            <Checkbox checked={termsChecked} onToggle={() => setTermsChecked((v) => !v)}>
              <Trans
                i18nKey="submit.acceptTerms"
                ns="contentCapture"
                components={{
                  terms: (
                    <Text
                      style={s.link}
                      onPress={() => Alert.alert(t('submit.termsTitle'), t('submit.termsSoon'))}
                      accessibilityRole="link"
                    />
                  ),
                }}
              />
            </Checkbox>
          </View>

          <View style={s.actions}>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={t('cancel', { ns: 'common' })}
              style={({ pressed }) => [s.cancelBtn, pressed && s.pressed]}
            >
              <Text style={s.cancelText}>{t('cancel', { ns: 'common' })}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel={t('submit.submit')}
              accessibilityState={{ disabled: !canSubmit }}
              style={({ pressed }) => [s.submitBtn, !canSubmit && s.submitBtnDisabled, pressed && canSubmit && s.pressed]}
            >
              <Text style={[s.submitText, !canSubmit && s.submitTextDisabled]}>
                {submitting ? t('submit.submitting') : t('submit.submit')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: D.onSurface,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },

  link: { color: D.primary, fontFamily: Typography.fontBodySemi, textDecorationLine: 'underline' },

  actions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { textAlign: 'center', lineHeight: 20, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  submitBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    backgroundColor: D.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: D.surfaceVariant },
  submitText: { textAlign: 'center', lineHeight: 20, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },
  submitTextDisabled: { color: D.onSurfaceVariant },

  pressed: { opacity: 0.85 },
});

export default SubmitConfirmationModal;
