import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { creatorDashboardApi } from '../../../services/api/creatorDashboardApi';
import { ApiError } from '../../../services/api/client';
import type { JobResponse, PaymentProofFile } from '../../../types/creatorDashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

/** A plain y-m-d key so "today" comparisons never drift across a UTC/local boundary. */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PersonIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

const PinIcon: React.FC<IconProps> = ({ size = 13, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const CheckIcon: React.FC<{ size?: number }> = ({ size = 11 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const CameraIcon: React.FC<IconProps> = ({ size = 26, color = D.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <Circle cx="12" cy="14" r="3.5" />
  </Svg>
);

const TrashIcon: React.FC<IconProps> = ({ size = 16, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 7h16M9 4h6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar — back arrow, since this is reached via a button, not a nav tab
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
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const LogPaymentPage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  onSaved: () => void;
}> = ({ onNavigate, onBack, onSaved }) => {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [amountInput, setAmountInput] = useState('');
  const [tipInput, setTipInput] = useState('');
  const [proof, setProof] = useState<PaymentProofFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([creatorDashboardApi.getJobs('ACTIVE'), creatorDashboardApi.getJobs('UPCOMING')])
      .then(([active, upcoming]) => {
        const todayKey = dateKey(new Date());
        const all = [...active, ...upcoming];
        // "Today's opportunity" — jobs actually scheduled today; if none are,
        // fall back to every active engagement so the list is never empty.
        const todays = all.filter((j) => j.scheduledAt && dateKey(new Date(j.scheduledAt)) === todayKey);
        const list = todays.length > 0 ? todays : active;
        setJobs(list);
        if (list.length > 0) setSelectedJobId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, []);

  const requestPermission = async (source: 'camera' | 'library'): Promise<boolean> => {
    const { status } =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        source === 'camera'
          ? 'Legacy Lens needs camera access to photograph a receipt.'
          : 'Legacy Lens needs access to your photo library to attach a receipt.',
      );
      return false;
    }
    return true;
  };

  const openPicker = async (source: 'camera' | 'library') => {
    const granted = await requestPermission(source);
    if (!granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setProof({
        uri: asset.uri,
        name: asset.fileName ?? `receipt-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  // Same "Take Photo / Choose from Library" chooser used for the profile
  // photo and creator-application proof flows.
  const handlePickProof = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) openPicker('camera');
          if (buttonIndex === 2) openPicker('library');
        },
      );
    } else {
      Alert.alert('Proof of payment', 'Choose a source', [
        { text: 'Take Photo', onPress: () => openPicker('camera') },
        { text: 'Choose from Library', onPress: () => openPicker('library') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedJobId) {
      Alert.alert('Select an opportunity', 'Choose which opportunity this payment belongs to.');
      return;
    }
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) {
      Alert.alert('Enter an amount', 'Enter how much you collected for this opportunity.');
      return;
    }
    if (!proof) {
      Alert.alert('Add proof', 'Attach a photo of the receipt as proof of collecting this payment.');
      return;
    }

    const parsedTip = parseFloat(tipInput);
    const tipAmount = tipInput.trim() && !isNaN(parsedTip) ? parsedTip : 0;

    setSubmitting(true);
    try {
      await creatorDashboardApi.addPayment({ jobId: selectedJobId, amount, tipAmount, proofDocument: proof });
      Alert.alert('Payment logged', 'Your collected payment has been saved.', [{ text: 'OK', onPress: onSaved }]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not log this payment.';
      Alert.alert('Save failed', message);
    } finally {
      setSubmitting(false);
    }
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
        <Text style={s.pageHeading}>Log a Payment</Text>
        <Text style={s.pageSubtitle}>Record cash you've just collected from a knowledge holder.</Text>

        {/* Select Opportunity */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select Opportunity</Text>
          {jobsLoading ? (
            <Text style={s.emptyStateText}>Loading today's opportunities…</Text>
          ) : jobs.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyStateText}>No opportunities available right now.</Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {jobs.map((job) => {
                const selected = job.id === selectedJobId;
                return (
                  <Pressable
                    key={job.id}
                    onPress={() => setSelectedJobId(job.id)}
                    style={({ pressed }) => [s.jobOption, selected && s.jobOptionSelected, pressed && s.pressed]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[s.radioCircle, selected && s.radioCircleSelected]}>
                      {selected && <CheckIcon />}
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={s.jobOptionTitle} numberOfLines={2}>{job.title}</Text>
                      <View style={s.jobOptionMetaRow}>
                        <View style={s.metaInline}>
                          <PersonIcon />
                          <Text style={s.jobOptionMetaText}>{job.elderName}</Text>
                        </View>
                        {job.location && (
                          <View style={s.metaInline}>
                            <PinIcon />
                            <Text style={s.jobOptionMetaText}>{job.location}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Amount Collected */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Amount Collected (LKR)</Text>
          <TextInput
            style={s.input}
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="e.g. 3000"
            placeholderTextColor={D.onSurfaceVariant}
            keyboardType="numeric"
            accessibilityLabel="Amount collected"
          />
        </View>

        {/* Proof of Payment */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Proof of Payment</Text>
          {proof ? (
            <View style={s.proofPreviewWrapper}>
              <Image source={{ uri: proof.uri }} style={s.proofPreviewImage} resizeMode="cover" accessibilityLabel="Selected receipt photo" />
              <Pressable
                onPress={() => setProof(null)}
                style={({ pressed }) => [s.proofRemoveBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <TrashIcon />
              </Pressable>
              <Pressable
                onPress={handlePickProof}
                style={({ pressed }) => [s.proofRetakeBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Replace photo"
              >
                <Text style={s.proofRetakeBtnText}>Replace Photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickProof}
              style={({ pressed }) => [s.uploadBox, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Add a proof photo"
            >
              <CameraIcon />
              <Text style={s.uploadBoxText}>Tap to add a photo</Text>
              <Text style={s.uploadBoxHint}>Camera or Photo Library</Text>
            </Pressable>
          )}
        </View>

        {/* Cash Tip */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Cash Tip (optional)</Text>
          <TextInput
            style={s.input}
            value={tipInput}
            onChangeText={setTipInput}
            placeholder="e.g. 200"
            placeholderTextColor={D.onSurfaceVariant}
            keyboardType="numeric"
            accessibilityLabel="Cash tip amount"
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed, submitting && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Add payment"
        >
          <Text style={s.addBtnText}>{submitting ? 'Adding…' : 'Add'}</Text>
        </Pressable>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default LogPaymentPage;

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
  pageHeading: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  pageSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, marginTop: -Spacing.sm },

  // ── Sections ─────────────────────────────────────────────────────────────
  section: { gap: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },

  emptyState: { paddingVertical: Spacing.md, alignItems: 'center' },
  emptyStateText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },

  // ── Opportunity picker ───────────────────────────────────────────────────
  jobOption: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.xl, padding: Spacing.md,
    borderWidth: 1.5, borderColor: D.surfaceVariant,
  },
  jobOptionSelected: { borderColor: D.primary, backgroundColor: D.surfaceContainerLow },
  radioCircle: {
    width: 22, height: 22, borderRadius: 11, marginTop: 2,
    borderWidth: 1.5, borderColor: D.surfaceVariant,
    alignItems: 'center', justifyContent: 'center',
  },
  radioCircleSelected: { backgroundColor: D.primary, borderColor: D.primary },
  jobOptionTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  jobOptionMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobOptionMetaText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  // ── Text inputs ──────────────────────────────────────────────────────────
  input: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.lg,
    backgroundColor: D.surfaceContainerLowest,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },

  // ── Proof upload ─────────────────────────────────────────────────────────
  uploadBox: {
    alignItems: 'center', justifyContent: 'center', gap: 4,
    minHeight: 140, borderRadius: Radii.xl,
    borderWidth: 1.5, borderColor: D.surfaceVariant, borderStyle: 'dashed',
    backgroundColor: D.surfaceContainerLow,
  },
  uploadBoxText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface, marginTop: 4 },
  uploadBoxHint: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  proofPreviewWrapper: {
    borderRadius: Radii.xl, overflow: 'hidden', backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant,
  },
  proofPreviewImage: { width: '100%', height: 180 },
  proofRemoveBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  proofRetakeBtn: {
    paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  proofRetakeBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: '#ffffff' },

  // ── Add button ───────────────────────────────────────────────────────────
  addBtn: {
    backgroundColor: D.primary, borderRadius: Radii.full,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minHeight: 48,
    shadowColor: D.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  addBtnPressed: { opacity: 0.9 },
  addBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff', letterSpacing: 0.3 },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
