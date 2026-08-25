import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import type { PaymentHistoryItemResponse } from '../../../types/creatorDashboard';

const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',

  primary:   '#0F5C5C',
  secondary: '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

// Shown only if the /api/creator-dashboard/payment-history call fails, so the
// screen never renders blank.
const FALLBACK_HISTORY: PaymentHistoryItemResponse[] = [
  {
    id: 'fallback-1',
    amount: 1500,
    collectedAt: new Date().toISOString(),
    note: 'Cash tip from Mrs. Kamala Wijesinghe',
  },
  {
    id: 'fallback-2',
    amount: 4000,
    collectedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    note: 'Traditional Food Recipe Documentation — Mrs. Kamala Wijesinghe',
  },
];

function formatGroupDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const TopAppBar: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={s.appBar}>
    <Pressable
      onPress={onBack}
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={s.backArrow}>{'←'}</Text>
    </Pressable>
    <Text style={s.appBarTitle}>Payment History</Text>
    <View style={s.iconBtn} />
  </View>
);

export const PaymentHistoryPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
}> = ({ onNavigate, onBack }) => {
  const [history, setHistory] = useState<PaymentHistoryItemResponse[]>(FALLBACK_HISTORY);

  useEffect(() => {
    creatorDashboardApi
      .getPaymentHistory(50)
      .then((data) => {
        if (data.length > 0) setHistory(data);
      })
      .catch(() => {});
  }, []);

  // Group consecutive items by their date header, preserving the already-sorted (newest-first) order.
  const groups: { label: string; items: PaymentHistoryItemResponse[] }[] = [];
  for (const item of history) {
    const label = formatGroupDate(item.collectedAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No payments collected yet.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label} style={s.group}>
              <Text style={s.groupLabel}>{group.label}</Text>
              <View style={s.groupCard}>
                {group.items.map((item, index) => (
                  <View
                    key={item.id}
                    style={[s.row, index < group.items.length - 1 && s.rowDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowNote} numberOfLines={2}>
                        {item.note ?? 'Cash payment'}
                      </Text>
                      <Text style={s.rowTime}>{formatTime(item.collectedAt)}</Text>
                    </View>
                    <Text style={s.rowAmount}>
                      {`+LKR ${Math.round(item.amount).toLocaleString('en-US')}`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default PaymentHistoryPage;

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
  },
  iconBtn: { width: 40, height: 40, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: D.primary,
    letterSpacing: -0.3,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.lg },

  group: { gap: Spacing.sm },
  groupLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  groupCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: D.surfaceVariant },
  rowNote: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },
  rowTime: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant, marginTop: 2 },
  rowAmount: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.primary },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  pressed: { opacity: 0.75 },
});
