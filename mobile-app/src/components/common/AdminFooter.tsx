import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Radii, Spacing } from '../../theme';

export type AdminTabKey = 'admin_home' | 'intake' | 'review' | 'admin_profile';

interface AdminFooterProps {
  activeTab: AdminTabKey;
  onTabSelect: (tab: AdminTabKey) => void;
  intakeBadge?: string | null;
  reviewBadge?: string | null;
}

export const AdminFooter: React.FC<AdminFooterProps> = ({ activeTab, onTabSelect, intakeBadge, reviewBadge }) => {
  const tabs: Array<{ key: AdminTabKey; icon: string; label: string; badge: string | null; badgeErr?: boolean }> = [
    { key: 'admin_home',    icon: 'home',      label: 'Home',       badge: null },
    { key: 'intake',        icon: 'inbox',     label: 'Opportunities',     badge: intakeBadge !== undefined ? intakeBadge : '18' },
    { key: 'review',        icon: 'gavel',     label: 'Moderation', badge: reviewBadge !== undefined ? reviewBadge : '5', badgeErr: true },
    { key: 'admin_profile', icon: 'person',    label: 'Profile',    badge: null },
  ];

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onTabSelect(tab.key)}
              activeOpacity={0.75}
            >
              <View>
                <MaterialIcons
                  name={tab.icon as any}
                  size={22}
                  color={isActive ? Colors.secondary : Colors.textMuted}
                />
                {tab.badge && (
                  <View style={[styles.navBadge, tab.badgeErr && styles.navBadgeErr]}>
                    <Text style={styles.navBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,92,92,0.1)',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm, 
    paddingHorizontal: Spacing.sm,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center', gap: 2, paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: Radii.lg,
  },
  navItemActive: { backgroundColor: 'rgba(15,92,92,0.1)' },
  navLabel: {
    fontFamily: Typography.fontBodyMed, fontSize: 10, color: Colors.textMuted,
  },
  navLabelActive: { color: Colors.secondary, fontWeight: '600' },
  navBadge: {
    position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16,
    borderRadius: 8, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2,
  },
  navBadgeErr: { backgroundColor: '#BA1A1A' },
  navBadgeText: {
    fontFamily: Typography.fontBodyMed, fontSize: 9,
    fontWeight: '700', color: Colors.white,
  },
});
