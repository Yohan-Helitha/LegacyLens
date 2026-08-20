import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { profileApi } from '../../../services/api/profileApi';
import { creatorApplicationApi } from '../../../services/api/creatorApplicationApi';
import { ApiError } from '../../../services/api/client';
import { useAuthStore } from '../../../store/authStore';
import type { UserProfile } from '../../../types/profile';
import type {
  CreatorApplicationProofFile,
  ExperienceLevel as ApiExperienceLevel,
} from '../../../types/creatorApplication';

// ─────────────────────────────────────────────────────────────────────────────
// Local design tokens (mapped from HTML Tailwind colour system — Monsoon Coast)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  // ── 60% dominant — surfaces
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceContainer:       '#e4efef',
  surfaceContainerHigh:   '#d8e8e8',
  surfaceVariant:         '#c8dcdc',
  outlineVariant:         '#a0c4c4',

  // ── 30% primary — teal
  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  // ── 10% accent — orange
  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   'rgba(15, 92, 92, 0.12)',

  // ── Text
  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
  outline:          '#718096',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ExperienceOptionKey = 'new' | 'some' | 'experienced';

const SKILL_OPTIONS = [
  'Photography',
  'Videography',
  'Script Writing',
  'Transcription',
  'Basic Video Editing',
] as const;

const INTEREST_OPTIONS = [
  'Traditional Foods',
  'Fishing Heritage',
  'Local History',
  'Traditional Dance',
] as const;

const EXPERIENCE_OPTIONS: { key: ExperienceOptionKey; label: string }[] = [
  { key: 'new',          label: 'New to content documentation' },
  { key: 'some',         label: 'Some Experience' },
  { key: 'experienced',  label: 'Experienced' },
];

/** UI radio key -> backend ExperienceLevel enum name. */
const EXPERIENCE_LEVEL_API: Record<ExperienceOptionKey, ApiExperienceLevel> = {
  new: 'NEW_TO_DOCUMENTATION',
  some: 'SOME_EXPERIENCE',
  experienced: 'EXPERIENCED',
};

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC = () => (
  <View style={s.appBar}>
    <Pressable
      style={({ pressed }) => [s.appBarIconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <View style={s.hamburger}>
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
      </View>
    </Pressable>

    <Text style={s.appBarTitle}>Legacy Lens</Text>

    <Pressable
      style={({ pressed }) => [s.appBarIconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// FormSection — card wrapper with an uppercase teal section label
// ─────────────────────────────────────────────────────────────────────────────
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={s.section}>
    <Text style={s.sectionLabel}>{title}</Text>
    {children}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// FormField — labeled text input
// ─────────────────────────────────────────────────────────────────────────────
const FormField: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureIcon?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
}> = ({ label, value, onChangeText, placeholder, secureIcon, keyboardType = 'default' }) => (
  <View style={s.fieldGroup}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={s.fieldInputWrapper}>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={D.outline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
      {secureIcon && <Text style={s.lockIcon}>{'🔒'}</Text>}
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// ReadOnlyField — auto-filled from the user's own account, not editable here
// ─────────────────────────────────────────────────────────────────────────────
const ReadOnlyField: React.FC<{
  label: string;
  value: string;
  lockIcon?: boolean;
}> = ({ label, value, lockIcon }) => (
  <View style={s.fieldGroup}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={[s.fieldInputWrapper, s.fieldInputWrapperLocked]}>
      <Text style={s.fieldReadOnlyValue} numberOfLines={1}>
        {value || '—'}
      </Text>
      {lockIcon && <Text style={s.lockIcon}>{'🔒'}</Text>}
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// CheckboxRow — 44pt touch target selectable row
// ─────────────────────────────────────────────────────────────────────────────
const CheckboxRow: React.FC<{
  label: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ label, checked, onToggle }) => (
  <Pressable
    onPress={onToggle}
    style={({ pressed }) => [s.optionRow, pressed && s.pressed]}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
    accessibilityLabel={label}
  >
    <View style={[s.checkbox, checked && s.checkboxChecked]}>
      {checked && <Text style={s.checkMark}>{'✓'}</Text>}
    </View>
    <Text style={s.optionText}>{label}</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// RadioRow — 44pt touch target selectable row
// ─────────────────────────────────────────────────────────────────────────────
const RadioRow: React.FC<{
  label: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ label, selected, onSelect }) => (
  <Pressable
    onPress={onSelect}
    style={({ pressed }) => [s.optionRow, pressed && s.pressed]}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    accessibilityLabel={label}
  >
    <View style={[s.radio, selected && s.radioSelected]}>
      {selected && <View style={s.radioDot} />}
    </View>
    <Text style={s.optionText}>{label}</Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const BecomeCreatorApplication: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onSubmit?: () => void;
}> = ({ onNavigate, onSubmit }) => {
  // Full Name / Phone Number / City / NIC Number are never typed in here —
  // they're auto-filled from the applicant's own account (read-only below).
  const cachedUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getMe()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        // Non-fatal — the fields below fall back to cached auth-store data.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = profile?.fullName ?? cachedUser?.fullName ?? '';
  const phoneNumber = profile?.phoneNumber ?? cachedUser?.phoneNumber ?? '';
  const city = profile?.city?.name ?? '';
  const nicNumber = profile?.nicNumber ?? '';

  const [email, setEmail] = useState('');
  const [aboutYou, setAboutYou] = useState('');
  const [skills, setSkills] = useState<Record<string, boolean>>({});
  const [interests, setInterests] = useState<Record<string, boolean>>({});
  const [experienceLevel, setExperienceLevel] = useState<ExperienceOptionKey | null>(null);
  const [experienceDetails, setExperienceDetails] = useState('');
  const [proofFile, setProofFile] = useState<CreatorApplicationProofFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (skill: string) =>
    setSkills(prev => ({ ...prev, [skill]: !prev[skill] }));

  const toggleInterest = (interest: string) =>
    setInterests(prev => ({ ...prev, [interest]: !prev[interest] }));

  const handlePickProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Legacy Lens needs access to your photo library to attach a verification proof file. Please enable it in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setProofFile({
        uri: asset.uri,
        name: asset.fileName ?? `proof-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const handleSubmit = async () => {
    const selectedSkills = SKILL_OPTIONS.filter(skill => skills[skill]);
    const selectedInterests = INTEREST_OPTIONS.filter(interest => interests[interest]);

    if (!email.trim()) {
      Alert.alert('Missing information', 'Please enter your email address.');
      return;
    }
    if (!aboutYou.trim()) {
      Alert.alert('Missing information', 'Please tell us a bit about yourself.');
      return;
    }
    if (selectedSkills.length === 0) {
      Alert.alert('Missing information', 'Please select at least one skill.');
      return;
    }
    if (selectedInterests.length === 0) {
      Alert.alert('Missing information', 'Please select at least one interest.');
      return;
    }
    if (!experienceLevel) {
      Alert.alert('Missing information', 'Please select your experience level.');
      return;
    }
    if (!experienceDetails.trim()) {
      Alert.alert('Missing information', 'Please tell us about your experience.');
      return;
    }
    if (!proofFile) {
      Alert.alert('Missing information', 'Please attach a verification proof file.');
      return;
    }

    setSubmitting(true);
    try {
      await creatorApplicationApi.submit({
        email: email.trim(),
        aboutYou: aboutYou.trim(),
        skills: selectedSkills,
        interests: selectedInterests,
        experienceLevel: EXPERIENCE_LEVEL_API[experienceLevel],
        experienceDescription: experienceDetails.trim(),
        proofDocument: proofFile,
      });
      onSubmit?.();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Submission failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page heading ──────────────────────────────────────────────── */}
        <View style={s.headingBlock}>
          <Text style={s.pageHeading}>Become a Content Creator</Text>
          <Text style={s.pageSubheading}>
            Join our community of heritage documentarians.
          </Text>
        </View>

        {/* ── Section 1 — Your Information ─────────────────────────────── */}
        <FormSection title="Your Information">
          <ReadOnlyField label="Full Name" value={fullName} />
          <ReadOnlyField label="Phone Number" value={phoneNumber} />
          <FormField label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email address" keyboardType="email-address" />
          <ReadOnlyField label="City" value={city} />
          <ReadOnlyField label="NIC Number" value={nicNumber} lockIcon />
          <View style={s.helperRow}>
            <Text style={s.helperIcon}>{'ℹ️'}</Text>
            <Text style={s.helperText}>
              Full Name, Phone Number, City and NIC Number are taken from your account and can't be edited here.
              Your NIC number is used only for verification — it won't be shown publicly.
            </Text>
          </View>
        </FormSection>

        {/* ── Section 2 — About You ────────────────────────────────────── */}
        <FormSection title="About You">
          <TextInput
            style={s.textArea}
            value={aboutYou}
            onChangeText={setAboutYou}
            placeholder="I'm interested in documenting traditional foods and culture..."
            placeholderTextColor={D.outline}
            multiline
            textAlignVertical="top"
          />
        </FormSection>

        {/* ── Section 3 — My Skills ─────────────────────────────────────── */}
        <FormSection title="My Skill">
          {SKILL_OPTIONS.map(skill => (
            <CheckboxRow
              key={skill}
              label={skill}
              checked={!!skills[skill]}
              onToggle={() => toggleSkill(skill)}
            />
          ))}
        </FormSection>

        {/* ── Section 4 — Interests ─────────────────────────────────────── */}
        <FormSection title="Interests">
          {INTEREST_OPTIONS.map(interest => (
            <CheckboxRow
              key={interest}
              label={interest}
              checked={!!interests[interest]}
              onToggle={() => toggleInterest(interest)}
            />
          ))}
        </FormSection>

        {/* ── Section 5 — Experience ────────────────────────────────────── */}
        <FormSection title="Experience">
          {EXPERIENCE_OPTIONS.map(opt => (
            <RadioRow
              key={opt.key}
              label={opt.label}
              selected={experienceLevel === opt.key}
              onSelect={() => setExperienceLevel(opt.key)}
            />
          ))}
          <TextInput
            style={[s.textArea, s.experienceTextArea]}
            value={experienceDetails}
            onChangeText={setExperienceDetails}
            placeholder="Tell us about your experience..."
            placeholderTextColor={D.outline}
            multiline
            textAlignVertical="top"
          />
        </FormSection>

        {/* ── Section 6 — Verification ─────────────────────────────────── */}
        <FormSection title="Verification">
          <Pressable
            onPress={handlePickProof}
            style={({ pressed }) => [s.uploadBox, pressed && s.uploadBoxPressed]}
            accessibilityRole="button"
            accessibilityLabel="Upload supporting proof"
          >
            <View style={s.uploadIconCircle}>
              <Text style={s.uploadIconArrow}>{'↑'}</Text>
            </View>
            <Text style={s.uploadTitle}>
              {proofFile ? proofFile.name : 'Uploading Supporting Proof'}
            </Text>
            <Text style={s.uploadSubtitle}>
              Portfolio, previous work or organization proof (LinkedIn profile, etc.)
            </Text>
          </Pressable>
        </FormSection>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            s.submitBtn,
            (pressed || submitting) && s.submitBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Submit for review"
          accessibilityState={{ disabled: submitting }}
        >
          <Text style={s.submitBtnText}>
            {submitting ? 'Submitting…' : 'Submit For Review'}
          </Text>
        </Pressable>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default BecomeCreatorApplication;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ────────────────────────────────────────────────────────────────
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  appBarIconBtn: {
    width: 44, height: 44, borderRadius: Radii.full,  // 44pt touch target
    alignItems: 'center', justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  hamburger:     { gap: 4 },
  hamburgerLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: D.primary },
  bellWrapper: { alignItems: 'center' },
  bellTop:     { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody:    { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper: { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Page heading ───────────────────────────────────────────────────────────
  headingBlock: { gap: Spacing.xs, marginBottom: Spacing.xs },
  pageHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,      // 24sp — standard h1 for mobile
    lineHeight: 32,
    letterSpacing: -0.3,
    color: D.primary,                 // Primary teal (30% rule)
    fontWeight: '700',
  },
  pageSubheading: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp — secondary copy
    lineHeight: 20,
    color: D.onSurfaceVariant,
  },

  // ── Section card ───────────────────────────────────────────────────────────
  section: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: 24,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 1,
  },
  sectionLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 12,                     // label-md — 12sp uppercase section label
    lineHeight: 16,
    color: D.primary,                 // teal (30% rule)
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // ── Fields ─────────────────────────────────────────────────────────────────
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 12,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.surfaceContainerLow,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    paddingHorizontal: Spacing.sm,
  },
  fieldInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,      // 16sp — standard input text
    color: D.onSurface,
    paddingVertical: 12,
    minHeight: 44,                    // 44pt touch target
  },
  lockIcon: { fontSize: 14, marginLeft: Spacing.xs },
  fieldInputWrapperLocked: { opacity: 0.65 },
  fieldReadOnlyValue: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,      // 16sp — matches the editable inputs
    color: D.onSurface,
    paddingVertical: 12,
    minHeight: 44,                    // 44pt touch target
  },

  helperRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: -Spacing.xs },
  helperIcon: { fontSize: 12, lineHeight: 18 },
  helperText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 12,
    lineHeight: 18,
    color: D.onSurfaceVariant,
  },

  // ── Textarea ───────────────────────────────────────────────────────────────
  textArea: {
    minHeight: 120,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    backgroundColor: D.surfaceContainerLow,
    padding: Spacing.sm,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp — body-md
    lineHeight: 20,
    color: D.onSurface,
  },
  experienceTextArea: { minHeight: 100 },

  // ── Checkbox / Radio option rows ──────────────────────────────────────────
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,                    // 44pt touch target
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.md,
  },
  optionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,      // 14sp
    color: D.onSurface,
    flexShrink: 1,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: D.outline,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: { backgroundColor: D.primary, borderColor: D.primary },
  checkMark: { fontSize: 14, color: '#ffffff', fontWeight: '700', lineHeight: 16 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: D.outline,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  radioSelected: { borderColor: D.primary },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: D.primary },

  // ── Verification upload box ───────────────────────────────────────────────
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: D.outlineVariant,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.surfaceContainerLow,
    gap: Spacing.xs,
  },
  uploadBoxPressed: { opacity: 0.85 },
  uploadIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: D.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  uploadIconArrow: { fontSize: 22, color: '#ffffff', fontWeight: '700' },
  uploadTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp
    color: D.onSurface,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: D.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: '85%',
  },

  // ── Submit button ──────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: D.primary,       // teal (30% — primary action)
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 48,                    // touch target
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnPressed: { opacity: 0.9 },
  submitBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,      // 16sp — button label
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
