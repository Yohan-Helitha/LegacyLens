import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { opportunityApplicationApi } from '../../../services/api/opportunityApplicationApi';
import { ApiError } from '../../../services/api/client';
import type { OpportunityApplicationResponse } from '../../../types/opportunityApplication';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

function formatSavedDate(iso: string): string {
  return `Saved ${new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function formatScheduledDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons — same outline style/colour used across the opportunity screens
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PersonIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

const PinIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CalendarIcon: React.FC<IconProps> = ({ size = 14, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 5h18v16H3z" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const TrashIcon: React.FC<IconProps> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="4" y1="7" x2="20" y2="7" />
    <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <Line x1="9" y1="4" x2="15" y2="4" />
    <Line x1="10" y1="11" x2="10" y2="17" />
    <Line x1="14" y1="11" x2="14" y2="17" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={s.appBar}>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
      <Text style={s.backArrow}>{'←'}</Text>
    </Pressable>
    <Text style={s.appBarTitle}>Legacy Lens</Text>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Notifications">
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ label: string }> = ({ label }) => (
  <View style={s.badge}>
    <Text style={s.badgeText}>{label}</Text>
  </View>
);

const DetailRows: React.FC<{ record: OpportunityApplicationResponse }> = ({ record }) => (
  <View style={{ gap: 6 }}>
    <View style={s.infoRow}>
      <PersonIcon />
      <Text style={s.infoText} numberOfLines={1}>{record.elderName}</Text>
    </View>
    {record.location && (
      <View style={s.infoRow}>
        <PinIcon />
        <Text style={s.infoText}>{record.location}</Text>
      </View>
    )}
    <View style={s.dateTimeRow}>
      <View style={s.infoRow}>
        <CalendarIcon />
        <Text style={s.infoTextStrong}>{formatScheduledDate(record.scheduledDate) ?? '—'}</Text>
      </View>
      {record.timeWindowText && <Text style={s.infoTextStrong}>{record.timeWindowText}</Text>}
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const SavedOpportunityApplication: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onEditDraft: (opportunityId: string) => void;
  onViewOpportunity: (opportunityId: string) => void;
}> = ({ onNavigate, onBack, onEditDraft, onViewOpportunity }) => {
  const [applications, setApplications] = useState<OpportunityApplicationResponse[]>([]);

  const loadApplications = useCallback(() => {
    opportunityApplicationApi.getMyApplications().then(setApplications).catch(() => {});
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const saved = applications.filter((a) => a.status === 'SAVED');
  const submitted = applications.filter((a) => a.status === 'PENDING' || a.status === 'APPROVED');

  const confirmDelete = (record: OpportunityApplicationResponse) => {
    Alert.alert(
      'Delete this application?',
      `"${record.title}" will be removed${record.status === 'SAVED' ? ' from your saved drafts' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await opportunityApplicationApi.remove(record.id);
              loadApplications();
            } catch (err) {
              const message = err instanceof ApiError ? err.message : 'Could not delete this application.';
              Alert.alert('Delete failed', message);
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async (record: OpportunityApplicationResponse) => {
    try {
      await opportunityApplicationApi.submit(record.id);
      loadApplications();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not submit this application.';
      Alert.alert('Submit failed', message);
    }
  };

  const handleView = (record: OpportunityApplicationResponse) => {
    onViewOpportunity(record.opportunityId);
  };

  const handleBook = (record: OpportunityApplicationResponse) => {
    // There's no real booking/assignment backend yet — this just confirms
    // the intent locally, same stopgap used for the schedule page's "View".
    Alert.alert('Booking requested', `The knowledge holder will confirm your booking for "${record.title}".`);
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Saved Application */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Saved Application</Text>

          {saved.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>No saved drafts yet.</Text>
            </View>
          ) : (
            saved.map((record) => (
              <View key={record.id} style={s.card}>
                <View style={s.cardTopRow}>
                  <StatusBadge label="Saved" />
                  <Text style={s.savedDateText}>{formatSavedDate(record.savedAt)}</Text>
                </View>

                <Text style={s.cardTitle} numberOfLines={2}>{record.title}</Text>

                <DetailRows record={record} />

                <View style={s.actionsRow}>
                  <View style={s.actionsLeft}>
                    <Pressable
                      onPress={() => onEditDraft(record.opportunityId)}
                      style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${record.title}`}
                    >
                      <Text style={s.outlineBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleSubmit(record)}
                      style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Submit ${record.title}`}
                    >
                      <Text style={s.fillBtnText}>Submit</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => confirmDelete(record)}
                    style={({ pressed }) => [s.trashBtn, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${record.title}`}
                  >
                    <TrashIcon />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Submitted Application */}
        <View style={s.section}>
          <View>
            <Text style={s.sectionTitle}>Submitted Application</Text>
            <Text style={s.sectionSubtitle}>Application already you have sent to the knowledge holder.</Text>
          </View>

          {submitted.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>Nothing submitted yet.</Text>
            </View>
          ) : (
            submitted.map((record) => (
              <View key={record.id} style={s.card}>
                <View style={s.cardTopRow}>
                  <StatusBadge label={record.status === 'PENDING' ? 'Pending' : 'Approved'} />
                  <Pressable
                    onPress={() => confirmDelete(record)}
                    style={({ pressed }) => [s.trashBtn, pressed && s.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Cancel ${record.title}`}
                  >
                    <TrashIcon />
                  </Pressable>
                </View>

                <Text style={s.cardTitle} numberOfLines={2}>{record.title}</Text>

                <DetailRows record={record} />

                <View style={s.actionsRow}>
                  {record.status === 'APPROVED' ? (
                    <View style={s.actionsLeft}>
                      <Pressable
                        onPress={() => handleView(record)}
                        style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${record.title}`}
                      >
                        <Text style={s.outlineBtnText}>View</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleBook(record)}
                        style={({ pressed }) => [s.fillBtn, pressed && s.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Book ${record.title}`}
                      >
                        <Text style={s.fillBtnText}>Book</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleView(record)}
                      style={({ pressed }) => [s.fillBtn, { flex: 0, minWidth: 112 }, pressed && s.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${record.title}`}
                    >
                      <Text style={s.fillBtnText}>View</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default SavedOpportunityApplication;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ──────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBtn: { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  bellWrapper:  { alignItems: 'center' },
  bellTop:      { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody:     { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper:  { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    color: D.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: D.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },

  emptyState: { paddingVertical: Spacing.md, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { backgroundColor: D.primary, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 5 },
  badgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#ffffff', letterSpacing: 0.3 },
  savedDateText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, lineHeight: 22, color: D.onSurface },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },
  infoTextStrong: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  actionsLeft: { flexDirection: 'row', gap: Spacing.sm, flex: 1 },
  outlineBtn: {
    flex: 1, maxWidth: 110, paddingVertical: 9, borderRadius: Radii.full,
    borderWidth: 1.5, borderColor: D.secondary, alignItems: 'center', justifyContent: 'center', minHeight: 40,
  },
  outlineBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.secondary },
  fillBtn: {
    flex: 1, maxWidth: 130, paddingVertical: 9, borderRadius: Radii.full,
    backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center', minHeight: 40,
  },
  fillBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#ffffff' },
  trashBtn: { padding: 4 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
