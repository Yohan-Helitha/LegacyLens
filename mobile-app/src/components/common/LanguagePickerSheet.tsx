import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Radii, Spacing, Typography } from '../../theme';
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES, useLocaleStore } from '../../store/localeStore';
import type { AppLocale } from '../../store/localeStore';

interface LanguagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Lets the elder change the app language after onboarding (the Language screen only shows on first launch).
 * Each language is written in its own script, so it can be found even if the screen is currently in a
 * language the person can't read. Picking one switches the whole app immediately.
 */
export const LanguagePickerSheet: React.FC<LanguagePickerSheetProps> = ({ visible, onClose }) => {
  const { t } = useTranslation('common');
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  const choose = (code: AppLocale) => {
    setLocale(code);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
        />
        <View style={s.card} accessibilityViewIsModal>
          <Text style={s.title} accessibilityRole="header">
            {t('language.title')}
          </Text>

          <View style={s.options} accessibilityRole="radiogroup">
            {SUPPORTED_LOCALES.map((code) => {
              const selected = code === locale;
              return (
                <Pressable
                  key={code}
                  onPress={() => choose(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={LOCALE_NATIVE_NAMES[code]}
                  style={({ pressed }) => [s.option, selected && s.optionSelected, pressed && s.optionPressed]}
                >
                  <Text style={[s.optionText, selected && s.optionTextSelected]}>{LOCALE_NATIVE_NAMES[code]}</Text>
                  {selected && <Check size={22} color={Colors.secondary} strokeWidth={2.6} />}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            style={({ pressed }) => [s.closeBtn, pressed && s.optionPressed]}
          >
            <Text style={s.closeText}>{t('close')}</Text>
          </Pressable>
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
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Platform.select({ android: { elevation: 8 } }),
  },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: Colors.text },
  options: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.surface,
    backgroundColor: Colors.white,
  },
  optionSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondarySubtle },
  optionPressed: { opacity: 0.85 },
  optionText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: Colors.text },
  optionTextSelected: { color: Colors.secondaryDark },
  closeBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.textMuted },
});

export default LanguagePickerSheet;
