import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Fingerprint, Phone, ShieldCheck } from 'lucide-react-native';
import { BackButton, SettingsListRow } from '../../components/common';
import { Colors, Typography, Spacing } from '../../theme';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PrivacyDataScreenProps {
  onChangePhone?: () => void;
  onChangeNic?: () => void;
  onChangePin?: () => void;
  onBack?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const PrivacyDataScreen: React.FC<PrivacyDataScreenProps> = ({
  onChangePhone,
  onChangeNic,
  onChangePin,
  onBack,
}) => {
  const { t } = useTranslation('profile');
  return (
  <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
    <StatusBar style="dark" backgroundColor={Colors.dominant} />

    <View style={styles.topBar}>
      <BackButton onPress={onBack} />
      <Text style={styles.title}>{t('privacy.title')}</Text>
      <View style={styles.topBarSpacer} />
    </View>

    <Text style={styles.sectionLabel}>{t('privacy.accountSecurity')}</Text>
    <View style={styles.card}>
      <SettingsListRow icon={Phone} label={t('privacy.changePhone')} onPress={onChangePhone} />
      <SettingsListRow icon={ShieldCheck} label={t('privacy.changeNic')} onPress={onChangeNic} />
      <SettingsListRow icon={Fingerprint} label={t('privacy.changePin')} onPress={onChangePin} />
    </View>

    <Text style={styles.hint}>{t('privacy.hint')}</Text>
  </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
    paddingHorizontal: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  topBarSpacer: {
    width: 48,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  sectionLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    marginLeft: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.4)',
    overflow: 'hidden',
  },
  hint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    lineHeight: 18,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    marginHorizontal: 4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});

export default PrivacyDataScreen;
