import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../../theme';

/** Matches the error/destructive red used elsewhere (e.g. forgot_pin.tsx) — not in the shared token set. */
const ERROR_COLOR = '#ba1a1a';

interface SettingsListRowProps {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  /** 'danger' drops the chevron and colors the icon/label red — for Log out. */
  variant?: 'default' | 'danger';
}

/** Icon + label + chevron row, used for every settings/navigation list item. */
export const SettingsListRow: React.FC<SettingsListRowProps> = ({
  icon: Icon,
  label,
  onPress,
  variant = 'default',
}) => {
  const isDanger = variant === 'danger';
  const tint = isDanger ? ERROR_COLOR : Colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.left}>
        <Icon size={20} color={tint} strokeWidth={2} />
        <Text style={[styles.label, isDanger && styles.labelDanger]}>{label}</Text>
      </View>
      {!isDanger && <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  rowPressed: {
    backgroundColor: Colors.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  labelDanger: {
    color: ERROR_COLOR,
  },
});

export default SettingsListRow;
