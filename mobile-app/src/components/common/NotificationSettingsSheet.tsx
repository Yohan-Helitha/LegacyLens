import React from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Radii, Spacing, Typography } from '../../theme';
import type { NotificationProblem, NotificationState } from '../../hooks/useNotificationSettings';

interface NotificationSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  state: NotificationState;
  busy: boolean;
  problem: NotificationProblem;
  onToggle: (next: boolean) => void;
}

/**
 * Profile > Notification settings: allow or block phone notifications. The switch really registers or removes
 * this phone with the server. When the phone itself blocks notifications the switch cannot override that, so it
 * says so and offers a button straight to the phone's settings for this app.
 */
export const NotificationSettingsSheet: React.FC<NotificationSettingsSheetProps> = ({
  visible,
  onClose,
  state,
  busy,
  problem,
  onToggle,
}) => {
  const { t } = useTranslation('profile');
  const isOn = state === 'on';
  const cannotChange = state === 'unsupported' || busy;
  const message =
    problem === 'failed'
      ? t('notifications.failed')
      : problem === 'unsupported' || state === 'unsupported'
        ? t('notifications.unsupported')
        : null;
  const showBlocked = state === 'blocked' || problem === 'blocked';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('notifications.close')} />
        <View style={s.card} accessibilityViewIsModal>
          <Text style={s.title} accessibilityRole="header">
            {t('notifications.title')}
          </Text>
          <Text style={s.description}>{t('notifications.description')}</Text>

          <View style={s.row}>
            <Text style={s.rowLabel}>{t('notifications.allow')}</Text>
            {busy ? (
              <ActivityIndicator color={Colors.secondary} />
            ) : (
              <Switch
                value={isOn}
                onValueChange={onToggle}
                disabled={cannotChange}
                trackColor={{ false: '#c8dcdc', true: Colors.secondary }}
                thumbColor={Colors.white}
                accessibilityLabel={t('notifications.allow')}
                accessibilityState={{ checked: isOn, disabled: cannotChange }}
              />
            )}
          </View>
          <Text style={[s.status, showBlocked && s.statusBlocked]} accessibilityLiveRegion="polite">
            {showBlocked ? t('notifications.statusBlocked') : isOn ? t('notifications.statusOn') : t('notifications.statusOff')}
          </Text>

          {showBlocked && (
            <>
              <Text style={s.help}>{t('notifications.blockedHelp')}</Text>
              <Pressable
                onPress={() => Linking.openSettings().catch(() => undefined)}
                accessibilityRole="button"
                style={({ pressed }) => [s.settingsBtn, pressed && s.pressed]}
              >
                <Text style={s.settingsBtnText}>{t('notifications.openSettings')}</Text>
              </Pressable>
            </>
          )}

          {!!message && (
            <Text style={s.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {message}
            </Text>
          )}
          {state === 'off' && !showBlocked && !message && <Text style={s.help}>{t('notifications.offNote')}</Text>}

          <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [s.doneBtn, pressed && s.pressed]}>
            <Text style={s.doneText}>{t('notifications.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: { width: '100%', maxWidth: 420, backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.lg, gap: Spacing.sm },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, lineHeight: 32, color: Colors.text },
  description: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, lineHeight: 24, color: Colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, marginTop: Spacing.sm },
  rowLabel: { flex: 1, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: Colors.text },
  status: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: Colors.secondary },
  statusBlocked: { color: '#9b4600' },
  help: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: Colors.textMuted },
  error: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, lineHeight: 21, color: '#ba1a1a' },
  settingsBtn: { minHeight: 48, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md },
  settingsBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.secondary },
  doneBtn: { minHeight: 52, borderRadius: Radii.lg, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  doneText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: Colors.white },
  pressed: { opacity: 0.85 },
});

export default NotificationSettingsSheet;
