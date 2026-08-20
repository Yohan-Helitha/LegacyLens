import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Home, GraduationCap, Store, User, LucideIcon } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

export type NavTab = 'home' | 'learn' | 'market' | 'profile';

interface BottomNavBarProps {
  active: NavTab;
  onTabPress?: (tab: NavTab) => void;
}

const TABS: { key: NavTab; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'learn', label: 'Learn', icon: GraduationCap },
  { key: 'market', label: 'Market', icon: Store },
  { key: 'profile', label: 'Profile', icon: User },
];

/**
 * Bottom tab bar matching the app's 4 sections. Only "profile" is wired to a
 * real screen today — Home/Learn/Market modules don't exist yet, so their
 * onTabPress calls are no-ops until those areas are built.
 */
export const BottomNavBar: React.FC<BottomNavBarProps> = ({ active, onTabPress }) => (
  <View style={styles.bar}>
    {TABS.map(({ key, label, icon: Icon }) => {
      const isActive = key === active;
      return (
        <Pressable
          key={key}
          onPress={() => onTabPress?.(key)}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: isActive }}
          style={[styles.tab, isActive && styles.tabActive]}
        >
          <Icon
            size={22}
            color={isActive ? Colors.white : 'rgba(255,255,255,0.7)'}
            strokeWidth={2}
          />
          <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    minWidth: 64,
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  label: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: 'rgba(255,255,255,0.7)',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  labelActive: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
  },
});

export default BottomNavBar;
