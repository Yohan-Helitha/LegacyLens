import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Typography, Spacing, Radii, Colors } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

interface SubmitConfirmationModalProps {
  visible: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const Checkbox: React.FC<{
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ checked, onToggle, children }) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [s.checkboxRow, pressed && s.pressed]}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
  >
    <View style={[s.checkboxBox, checked && s.checkboxBoxChecked]}>
      {checked && <Check size={14} color="#ffffff" strokeWidth={3} />}
    </View>
    <Text style={s.checkboxLabel}>{children}</Text>
  </Pressable>
);

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
            Submit this story?
          </Text>
          <Text style={s.body}>
            Are you sure you want to submit this? Once submitted, you won't be able to edit it.
          </Text>

          <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <Checkbox checked={accuracyChecked} onToggle={() => setAccuracyChecked((v) => !v)}>
              I confirm this story is accurate to the best of my knowledge.
            </Checkbox>

            <Checkbox checked={termsChecked} onToggle={() => setTermsChecked((v) => !v)}>
              I accept the{' '}
              <Text
                style={s.link}
                onPress={() =>
                  Alert.alert('Terms & Conditions', 'Terms & Conditions coming soon.')
                }
                accessibilityRole="link"
              >
                Terms & Conditions
              </Text>
              .
            </Checkbox>
          </View>

          <View style={s.actions}>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={({ pressed }) => [s.cancelBtn, pressed && s.pressed]}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Submit"
              accessibilityState={{ disabled: !canSubmit }}
              style={({ pressed }) => [s.submitBtn, !canSubmit && s.submitBtnDisabled, pressed && canSubmit && s.pressed]}
            >
              <Text style={[s.submitText, !canSubmit && s.submitTextDisabled]}>
                {submitting ? 'Submitting…' : 'Submit'}
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

  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, minHeight: 44 },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: D.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: { backgroundColor: D.primary, borderColor: D.primary },
  checkboxLabel: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
    lineHeight: 20,
  },
  link: { color: D.primary, fontFamily: Typography.fontBodySemi, textDecorationLine: 'underline' },

  actions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  submitBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.lg,
    backgroundColor: D.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: D.surfaceVariant },
  submitText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },
  submitTextDisabled: { color: D.onSurfaceVariant },

  pressed: { opacity: 0.85 },
});

export default SubmitConfirmationModal;
