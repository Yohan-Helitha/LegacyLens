import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { resolveUploadUrl } from '../../../constants/api';
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
  const [history, setHistory] = useState<PaymentHistoryItemResponse[]>([]);
  // Nothing is drawn until the server answers, so no stand-in payments flash up first.
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    creatorDashboardApi
      .getPaymentHistory(50)
      .then(setHistory)
      .catch(() => setLoadFailed(true))
      .finally(() => setLoaded(true));
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
        {!loaded ? (
          <ActivityIndicator color={D.primary} style={{ marginTop: Spacing.lg }} />
        ) : loadFailed ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>Could not load your payments.</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyStateText}>No payments collected yet.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label} style={s.group}>
              <Text style={s.groupLabel}>{group.label}</Text>
              <View style={s.groupCard}>
                {group.items.map((item, index) => {
                  const proofUri = resolveUploadUrl(item.proofDocumentUrl);
                  return (
                    <View
                      key={item.id}
                      style={[s.row, index < group.items.length - 1 && s.rowDivider]}
                    >
                      {proofUri && (
                        <Image source={{ uri: proofUri }} style={s.rowThumbnail} accessibilityLabel="Payment proof" />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowNote} numberOfLines={2}>
                          {item.opportunityTitle ?? item.note ?? 'Cash payment'}
                        </Text>
                        {item.elderName && <Text style={s.rowElder}>{item.elderName}</Text>}
                        <Text style={s.rowTime}>{formatTime(item.collectedAt)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.rowAmount}>
                          {`+LKR ${Math.round(item.totalAmount).toLocaleString('en-US')}`}
                        </Text>
                        {item.tipAmount > 0 && (
                          <Text style={s.rowTip}>{`incl. LKR ${Math.round(item.tipAmount).toLocaleString('en-US')} tip`}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
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
  rowThumbnail: { width: 40, height: 40, borderRadius: Radii.md, backgroundColor: D.surfaceVariant },
  rowNote: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },
  rowElder: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, marginTop: 1 },
  rowTime: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant, marginTop: 2 },
  rowAmount: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.primary },
  rowTip: { fontFamily: Typography.fontBody, fontSize: 10, color: D.onSurfaceVariant, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  pressed: { opacity: 0.75 },
});
