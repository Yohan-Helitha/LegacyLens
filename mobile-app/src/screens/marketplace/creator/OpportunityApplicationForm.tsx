import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { opportunityApi } from '../../../services/api/opportunityApi';
import { profileApi } from '../../../services/api/profileApi';
import { opportunityApplicationApi } from '../../../services/api/opportunityApplicationApi';
import { ApiError } from '../../../services/api/client';
import type { OpportunityDetailResponse } from '../../../types/opportunity';
import { resolveOpportunityImage } from '../../../utils/opportunityImages';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

/**
 * The opportunity doesn't carry a "required skills" or "equipment" field on
 * the backend yet, so these checklists are static/illustrative for now —
 * matching the mockup — rather than derived from real per-opportunity data.
 */
const RELEVANT_SKILLS = ['Videography', 'Basic Video Editing', 'Documentation'];
const EQUIPMENT_ITEMS = ['Camera', 'Microphone'];

/** Keeps only the first 2 digits visible — a phone number is sensitive even to show as a form default. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  return `${digits.slice(0, 2)}X XXX XXXX`;
}

function formatScheduledDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons — same outline style/colour as OpportunityDetailPage's
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PinIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CalendarIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const CardIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

const ArrowRightIcon: React.FC<IconProps> = ({ size = 11, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </Svg>
);

const ClockCircleIcon: React.FC<IconProps> = ({ size = 20, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Polyline points="12 7 12 12 15 15" />
  </Svg>
);

const CheckMark: React.FC<{ color?: string }> = ({ color = '#ffffff' }) => (
  <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox — custom square, matches the mockup's teal-filled checked state
// ─────────────────────────────────────────────────────────────────────────────
const Checkbox: React.FC<{ label: string; checked: boolean; onToggle: () => void }> = ({
  label,
  checked,
  onToggle,
}) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [s.checkboxRow, pressed && s.pressed]}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={label}
  >
    <View style={[s.checkboxBox, checked && s.checkboxBoxChecked]}>
      {checked && <CheckMark />}
    </View>
    <Text style={s.checkboxLabel}>{label}</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar — back arrow (this screen is reached via "Apply", not a nav tab)
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={s.appBar}>
    <Pressable
      style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
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
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const OpportunityApplicationForm: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onSave: () => void;
  opportunityId: string | null;
}> = ({ onNavigate, onBack, onSave, opportunityId }) => {
  // Null until each real fetch resolves — no fallback/mock data; a genuine
  // failure surfaces as an error state instead of invented content.
  const [detail, setDetail] = useState<OpportunityDetailResponse | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  const [experienceText, setExperienceText] = useState('');
  const [approachText, setApproachText] = useState('');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opportunityId) {
      setLoadError('No opportunity was selected.');
      return;
    }
    opportunityApi
      .getById(opportunityId)
      .then(setDetail)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load this opportunity.'));

    // A creator applies to a given opportunity at most once — if they
    // already have a draft (or even a submitted application) for it, restore
    // what they'd already filled in instead of starting blank. Not found
    // (null data, no throw) simply means they're starting fresh.
    opportunityApplicationApi
      .getByOpportunity(opportunityId)
      .then((existing) => {
        if (!existing) return;
        setSelectedSkills(Object.fromEntries(existing.skills.map((k) => [k, true])));
        setExperienceText(existing.experienceText ?? '');
        setApproachText(existing.approachText ?? '');
        setAvailabilityConfirmed(existing.availabilityConfirmed);
        setSelectedEquipment(Object.fromEntries(existing.equipment.map((k) => [k, true])));
      })
      .catch(() => {});
  }, [opportunityId]);

  useEffect(() => {
    profileApi
      .getMe()
      .then((me) => {
        setName(me.fullName);
        setPhone(me.phoneNumber ? maskPhone(me.phoneNumber) : '—');
        setCity(me.city?.name ?? '—');
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load your profile.'));
  }, []);

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));

  const toggleEquipment = (item: string) =>
    setSelectedEquipment((prev) => ({ ...prev, [item]: !prev[item] }));

  const handleSave = async () => {
    if (!opportunityId) {
      Alert.alert('Cannot save', 'No opportunity is selected.');
      return;
    }

    setSaving(true);
    try {
      await opportunityApplicationApi.saveDraft({
        opportunityId,
        skills: Object.keys(selectedSkills).filter((k) => selectedSkills[k]),
        experienceText,
        approachText,
        availabilityConfirmed,
        equipment: Object.keys(selectedEquipment).filter((k) => selectedEquipment[k]),
      });
      Alert.alert('Application saved', 'Your application draft has been saved.', [
        { text: 'OK', onPress: onSave },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not save your application.';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  };

  // Held back until every fetch above settles — real data only, no
  // fallback/mock content, and a genuine failure shows as an error state.
  if (loadError) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <TopAppBar onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>{loadError}</Text>
        </View>
        <BottomNavBar activeTab="market" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  if (!detail || name === null || phone === null || city === null) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top'] as const}>
        <StatusBar style="dark" />
        <TopAppBar onBack={onBack} />
        <View style={s.loadingWrap}>
          <Text style={s.loadingText}>Loading…</Text>
        </View>
        <BottomNavBar activeTab="market" onNavigate={onNavigate} />
      </SafeAreaView>
    );
  }

  const availabilityText = detail.scheduledDate
    ? `${formatScheduledDate(detail.scheduledDate)}${detail.timeWindowText ? `, ${detail.timeWindowText}` : ''}`
    : (detail.timeWindowText ?? '—');

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar onBack={onBack} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageHeading}>Apply to Opportunity</Text>

        {/* Opportunity summary card */}
        <View style={s.card}>
          <View style={s.summaryRow}>
            <Image
              source={resolveOpportunityImage(detail.heroImageUrl)}
              style={s.thumbnail}
              accessibilityLabel={detail.title}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={s.summaryTitle} numberOfLines={2}>{detail.title}</Text>
            </View>
          </View>

          <View style={s.summaryMetaRow}>
            <Text style={s.elderName}>{detail.elderName}</Text>
            {detail.location && (
              <View style={s.metaInline}>
                <PinIcon />
                <Text style={s.metaInlineText}>{detail.location}</Text>
              </View>
            )}
          </View>

          <View style={s.dateStipendStrip}>
            <View style={s.metaInline}>
              <CalendarIcon />
              <Text style={s.stripText}>{formatScheduledDate(detail.scheduledDate)}</Text>
            </View>
            <View style={s.metaInline}>
              <CardIcon />
              <Text style={s.stripText}>{`LKR ${Math.round(detail.offeredAmount).toLocaleString('en-US')}`}</Text>
            </View>
          </View>

          <Pressable
            onPress={onBack}
            style={({ pressed }) => [s.viewOpportunityRow, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="View opportunity details"
          >
            <Text style={s.viewOpportunityText}>View Opportunity</Text>
            <ArrowRightIcon />
          </Pressable>
        </View>

        {/* Your Details */}
        <View style={s.card}>
          <View style={s.cardHeaderRow}>
            <Text style={s.cardTitle}>Your Details</Text>
            <Text style={s.editProfileText}>Edit Profile</Text>
          </View>
          <Text style={s.detailsName}>{name}</Text>
          <Text style={s.detailsMuted}>{phone}</Text>
          <Text style={s.detailsMuted}>{city}</Text>
        </View>

        {/* Relevant Skill */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Relevant Skill</Text>
          <View style={s.card}>
            {RELEVANT_SKILLS.map((skill) => (
              <Checkbox
                key={skill}
                label={skill}
                checked={!!selectedSkills[skill]}
                onToggle={() => toggleSkill(skill)}
              />
            ))}
          </View>
        </View>

        {/* Relevant Experience */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Relevant Experience</Text>
          <View style={s.textAreaCard}>
            <TextInput
              style={s.textArea}
              value={experienceText}
              onChangeText={setExperienceText}
              placeholder="Tell the knowledge holder about similar work you have done."
              placeholderTextColor={D.onSurfaceVariant}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Approach */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Approach</Text>
          <View style={s.textAreaCard}>
            <TextInput
              style={s.textArea}
              value={approachText}
              onChangeText={setApproachText}
              placeholder="How will you approach this documentation work."
              placeholderTextColor={D.onSurfaceVariant}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Availability */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Availability</Text>
          <View style={s.card}>
            <View style={s.availabilityRow}>
              <View style={s.availabilityBadge}>
                <ClockCircleIcon />
              </View>
              <Text style={s.availabilityText}>{availabilityText}</Text>
            </View>
            <Checkbox
              label="I'm available at this time."
              checked={availabilityConfirmed}
              onToggle={() => setAvailabilityConfirmed((v) => !v)}
            />
          </View>
        </View>

        {/* Equipment */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Equipment</Text>
          <View style={s.card}>
            {EQUIPMENT_ITEMS.map((item) => (
              <Checkbox
                key={item}
                label={item}
                checked={!!selectedEquipment[item]}
                onToggle={() => toggleEquipment(item)}
              />
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionsRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [s.discardBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Discard application"
          >
            <Text style={s.discardBtnText}>Discard</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [s.saveBtn, pressed && s.saveBtnPressed, saving && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Save application"
          >
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default OpportunityApplicationForm;

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
    gap: Spacing.md,
  },

  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Section cards ────────────────────────────────────────────────────────
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
  section: { gap: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },

  // ── Opportunity summary ──────────────────────────────────────────────────
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  thumbnail: {
    width: 84, height: 68, borderRadius: Radii.lg,
    backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  summaryTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  summaryMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  elderName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaInlineText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },
  dateStipendStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: D.surfaceContainerLow, borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  stripText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.onSurface },
  viewOpportunityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewOpportunityText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.secondary },

  // ── Your Details ─────────────────────────────────────────────────────────
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  editProfileText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  detailsName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  detailsMuted: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Text areas ───────────────────────────────────────────────────────────
  textAreaCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    padding: Spacing.sm,
  },
  textArea: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    color: D.onSurface,
    minHeight: 64,
  },

  // ── Checkbox ─────────────────────────────────────────────────────────────
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxBox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: D.secondary,
    backgroundColor: D.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxBoxChecked: { backgroundColor: D.primary, borderColor: D.primary },
  checkboxLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },

  // ── Availability ─────────────────────────────────────────────────────────
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availabilityBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: D.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  availabilityText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface, flex: 1 },

  // ── Actions ──────────────────────────────────────────────────────────────
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, paddingTop: Spacing.xs },
  discardBtn: {
    minWidth: 120, paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
    backgroundColor: D.surfaceContainerLowest,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  discardBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.secondary },
  saveBtn: {
    minWidth: 140, paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderRadius: Radii.full, backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center', minHeight: 44,
    shadowColor: D.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  saveBtnPressed: { opacity: 0.9 },
  saveBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
