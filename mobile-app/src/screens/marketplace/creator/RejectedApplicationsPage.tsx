import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import {
  ApplicationSummary,
  DeleteApplicationButton,
} from '../../../components/module-specific/marketplace/ApplicationCard';
import { useMyApplications } from '../../../hooks/useMyApplications';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';
import { groupApplications } from '../../../utils/applicationGroups';

const D = {
  surface:             '#EDEFEE',
  surfaceContainerLow: '#f0f5f5',
  surfaceVariant:      '#c8dcdc',

  primary:   '#0F5C5C',
  secondary: '#E8792E',
  danger:    '#B3261E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

const CrossIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = D.danger }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Line x1="9" y1="9" x2="15" y2="15" />
    <Line x1="15" y1="9" x2="9" y2="15" />
  </Svg>
);

/**
 * The applications a knowledge holder turned down. They still count as "submitted" on the My
 * Applications page, but are listed here so that page only shows what is still waiting.
 */
export const RejectedApplicationsPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onViewOpportunity: (opportunityId: string) => void;
}> = ({ onNavigate, onBack, onViewOpportunity }) => {
  const { applications, loaded, error: loadError, reload } = useMyApplications();
  const [refreshing, setRefreshing] = useState(false);

  const { rejected } = groupApplications(applications);

  const handleRefresh = () => {
    setRefreshing(true);
    reload().finally(() => setRefreshing(false));
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="back" onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={D.primary} colors={[D.primary]} />}
      >
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.headerIcon}>
              <CrossIcon />
            </View>
            <Text style={s.title}>Rejected Application</Text>
            <View style={s.countPill}>
              <Text style={s.countPillText}>{rejected.length}</Text>
            </View>
          </View>
          <Text style={s.subtitle}>
            The knowledge holder did not accept these applications. You can still apply to other opportunities.
          </Text>
        </View>

        {loadError && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{loadError}</Text>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [s.retryBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Try loading your applications again"
            >
              <Text style={s.retryBtnText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {loaded && !loadError && rejected.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No rejected applications.</Text>
          </View>
        )}

        {rejected.map((record: OpportunityApplicationResponse) => (
          <ApplicationSummary
            key={record.id}
            record={record}
            trailing={<DeleteApplicationButton record={record} onDeleted={reload} />}
          >
            <Pressable
              onPress={() => onViewOpportunity(record.opportunityId)}
              style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`View ${record.title}`}
            >
              <Text style={s.fillBtnText}>View Opportunity</Text>
            </Pressable>
          </ApplicationSummary>
        ))}

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default RejectedApplicationsPage;

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  header: { gap: 6, paddingHorizontal: 2, marginBottom: Spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: '#FDECEA',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: Typography.fontDisplay, fontSize: 18, color: D.danger },
  countPill: {
    minWidth: 28, height: 24, paddingHorizontal: 9, borderRadius: 12,
    backgroundColor: D.danger, alignItems: 'center', justifyContent: 'center',
  },
  countPillText: { fontFamily: Typography.fontBodySemi, fontSize: 12, color: '#ffffff' },
  subtitle: {
    fontFamily: Typography.fontBodyMed, fontSize: 12.5, color: '#5B7A7A', lineHeight: 18, paddingLeft: 2,
  },

  emptyState: {
    paddingVertical: Spacing.lg, alignItems: 'center',
    borderRadius: Radii.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLow,
  },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  fillBtn: {
    paddingVertical: 9, borderRadius: Radii.full, backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center', minHeight: 44, alignSelf: 'stretch',
  },
  fillBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1, color: '#ffffff' },

  errorBox: {
    backgroundColor: '#FDECEA', borderRadius: Radii.xl, padding: Spacing.md, gap: Spacing.sm, alignItems: 'center',
  },
  errorText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.danger, textAlign: 'center' },
  retryBtn: {
    paddingVertical: 8, paddingHorizontal: 20, minHeight: 44, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: D.danger, alignItems: 'center', justifyContent: 'center',
  },
  retryBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.danger },

  pressed: { opacity: 0.75 },
});
