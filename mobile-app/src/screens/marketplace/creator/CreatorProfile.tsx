import React from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { resolveImageUrl } from '../../../constants/api';
import { useCreatorProfile } from '../../../hooks/useCreatorProfile';
import { experienceBullets, experienceLabel } from '../../../utils/creatorProfileText';
import { proficiencyLabel } from '../../../utils/creatorLanguages';
import { ProofDocumentCard } from './ProofDocumentCard';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow:    '#f0f5f5',
  surfaceContainer:       '#e4efef',
  surfaceVariant:         '#c8dcdc',

  primary:              '#0F5C5C',
  onPrimary:            '#ffffff',

  secondary:            '#E8792E',
  onSecondary:          '#ffffff',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',

  gold: '#E8792E',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Small inline icons
// ─────────────────────────────────────────────────────────────────────────────
const StarIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = D.gold }) => (
  <Text style={{ fontSize: size, color, lineHeight: size + 2 }}>★</Text>
);

const CheckBadge: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <View style={[s.checkBadge, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={{ fontSize: size * 0.7, color: '#ffffff', fontWeight: '700' }}>{'✓'}</Text>
  </View>
);

const PencilIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = D.secondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Reusable section card
// ─────────────────────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, rightSlot, children }) => (
  <View style={s.card}>
    <View style={s.cardHeaderRow}>
      <Text style={s.cardTitle}>{title}</Text>
      {rightSlot}
    </View>
    {children}
  </View>
);

const Chip: React.FC<{ label: string; wide?: boolean }> = ({ label, wide }) => (
  <View style={[s.chip, wide && s.chipWide]}>
    <Text style={s.chipText} numberOfLines={1}>{label}</Text>
  </View>
);

const DetailRow: React.FC<{ label: string; value: string; isLast?: boolean }> = ({ label, value, isLast }) => (
  <View style={[s.detailRow, !isLast && s.detailRowDivider]}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={s.detailValue}>{value}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const CreatorProfile: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onOpenMyWork: () => void;
  onOpenSavedApplications: () => void;
  onOpenRejectedWork: () => void;
}> = ({ onNavigate, onOpenMyWork, onOpenSavedApplications, onOpenRejectedWork }) => {
  const { profile, loading, loadError, reload } = useCreatorProfile();

  const avatarUri = resolveImageUrl(profile?.avatarUrl) ?? undefined;
  const rating = profile?.rating != null ? Number(profile.rating) : null;
  const owner = profile?.ownerDetails ?? null;
  const bullets = experienceBullets(profile?.experienceDescription);

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <CreatorTopAppBar variant="menu" onOpenMyWork={onOpenMyWork} onOpenSavedApplications={onOpenSavedApplications} onOpenRejectedWork={onOpenRejectedWork} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page heading */}
        <View style={s.pageHeaderRow}>
          <Text style={s.pageHeading}>My Profile</Text>
          <Pressable
            style={({ pressed }) => [s.editBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <PencilIcon />
          </Pressable>
        </View>

        {loading && !profile ? (
          <View style={s.stateBox}>
            <ActivityIndicator size="large" color={D.primary} accessibilityLabel="Loading your profile" />
          </View>
        ) : loadError && !profile ? (
          <View style={s.stateBox}>
            <Text style={s.stateTitle}>Couldn't load your profile</Text>
            <Pressable onPress={reload} style={({ pressed }) => [s.retryBtn, pressed && s.pressed]} accessibilityRole="button">
              <Text style={s.retryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : profile ? (
          <>
            {/* Identity block */}
            <View style={s.identityBlock}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatar} accessibilityLabel={`${profile.name}'s profile photo`} />
              ) : (
                <View style={[s.avatar, s.avatarEmpty]}>
                  <Text style={s.avatarInitial}>{profile.name.trim().charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={s.name}>{profile.name}</Text>
              <View style={s.identityMetaRow}>
                <StarIcon />
                <Text style={s.ratingText}>{rating != null ? rating.toFixed(1) : '—'}</Text>
                <Text style={s.metaDot}>{'|'}</Text>
                <CheckBadge />
                <Text style={s.contribText}>{profile.contributionsCount} contributions</Text>
              </View>
            </View>

            {/* Personal details — the full NIC and contact details are the owner's eyes only */}
            <View style={s.card}>
              <DetailRow label="Full Name" value={profile.name} isLast={!profile.city && !owner} />
              {!!profile.city && <DetailRow label="City" value={profile.city} isLast={!owner} />}
              {!!owner?.email && <DetailRow label="Email" value={owner.email} />}
              {!!owner?.phoneNumber && <DetailRow label="Phone Number" value={owner.phoneNumber} />}
              {!!owner?.nicNumber && <DetailRow label="NIC Number" value={owner.nicNumber} isLast />}
            </View>

            {/* Saved verification document — owner only */}
            {owner && (
              <ProofDocumentCard
                status={owner.applicationStatus}
                proofUploaded={owner.proofUploaded}
                contentType={owner.proofContentType}
              />
            )}

            {/* About me */}
            {!!profile.aboutYou && (
              <SectionCard title="About me">
                <Text style={s.aboutText}>{`"${profile.aboutYou}"`}</Text>
              </SectionCard>
            )}

            {/* My Skills */}
            {profile.skills.length > 0 && (
              <SectionCard title="My Skills">
                <View style={s.chipsRow}>
                  {profile.skills.map((skill) => (
                    <Chip key={skill} label={skill} wide />
                  ))}
                </View>
              </SectionCard>
            )}

            {/* Language */}
            {profile.languages.length > 0 && (
              <SectionCard title="Language">
                <View style={{ gap: 4 }}>
                  {profile.languages.map((lang) => (
                    <Text key={lang.language} style={s.languageText}>
                      {lang.proficiency ? `${lang.language} — ${proficiencyLabel(lang.proficiency)}` : lang.language}
                    </Text>
                  ))}
                </View>
              </SectionCard>
            )}

            {/* Cultural Interests */}
            {profile.interests.length > 0 && (
              <SectionCard title="Cultural Interests">
                <View style={s.chipsRow}>
                  {profile.interests.map((interest) => (
                    <Chip key={interest} label={interest} wide />
                  ))}
                </View>
              </SectionCard>
            )}

            {/* Experience */}
            {(!!profile.experienceLevel || bullets.length > 0) && (
              <SectionCard
                title="Experience"
                rightSlot={<Text style={s.experienceYears}>{experienceLabel(profile.experienceLevel)}</Text>}
              >
                <View style={{ gap: 6 }}>
                  {bullets.map((bullet, index) => (
                    <View key={`${index}-${bullet}`} style={s.bulletRow}>
                      <View style={s.bulletDot} />
                      <Text style={s.bulletText}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            )}

            {/* Contribution Summary */}
            <View style={s.section}>
              <Text style={s.sectionTitleStandalone}>Contribution Summary</Text>
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{profile.completedCount}</Text>
                  <Text style={s.statLabel}>Completed</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{profile.approvedCount}</Text>
                  <Text style={s.statLabel}>Approved</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{profile.activeCount}</Text>
                  <Text style={s.statLabel}>Active</Text>
                </View>
              </View>
            </View>

            {/* Previous Contribution */}
            {profile.previousContributions.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitleStandalone}>Previous Contribution</Text>
                <View style={{ gap: Spacing.sm }}>
                  {profile.previousContributions.map((item) => (
                    <View key={item.jobId} style={s.contribCard} accessible accessibilityLabel={`${item.title}, completed`}>
                      <View style={s.approvedBadgeRow}>
                        <CheckBadge size={13} />
                        <Text style={s.approvedBadgeText}>Completed</Text>
                      </View>
                      <Text style={s.contribTitle}>{item.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="profile" onNavigate={onNavigate} profileAvatarUri={avatarUri} />
    </SafeAreaView>
  );
};

export default CreatorProfile;

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
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  appBarIconBtn: { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
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

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Page heading ─────────────────────────────────────────────────────────
  pageHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageHeading: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    color: D.primary,
    letterSpacing: -0.2,
  },
  editBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: D.secondaryContainer,
  },

  // ── Loading / error ──────────────────────────────────────────────────────
  stateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  stateTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  retryBtn: {
    minHeight: 44, paddingHorizontal: 24, borderRadius: Radii.full,
    backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center',
  },
  retryBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onPrimary },

  // ── Identity block ───────────────────────────────────────────────────────
  identityBlock: { alignItems: 'center', paddingVertical: Spacing.sm, gap: 6 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: D.surfaceContainerLowest,
    backgroundColor: D.surfaceContainer,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: D.primary },
  avatarInitial: { fontFamily: Typography.fontBodySemi, fontSize: 40, color: D.onPrimary },
  name: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG,
    color: D.onSurface,
    marginTop: 4,
  },
  identityMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  metaDot: { fontSize: Typography.sizeSM, color: D.surfaceVariant },
  contribText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  checkBadge: { backgroundColor: D.primary, alignItems: 'center', justifyContent: 'center' },

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
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.primary },
  aboutText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSurfaceVariant,
    fontStyle: 'italic',
  },
  languageText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.secondary },
  experienceYears: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: D.secondary,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: D.secondary, marginTop: 8 },
  bulletText: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: D.onSurfaceVariant },

  // ── Personal details ─────────────────────────────────────────────────────
  detailRow: { paddingVertical: 10 },
  detailRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: D.surfaceVariant },
  detailLabel: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  detailValue: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, marginTop: 2 },

  // ── Chips ────────────────────────────────────────────────────────────────
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: D.surfaceContainerLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipWide: { flexBasis: '46%', flexGrow: 1, alignItems: 'center' },
  chipText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurface },

  // ── Standalone section title (no card wrapper) ──────────────────────────
  section: { gap: Spacing.sm },
  sectionTitleStandalone: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
  },

  // ── Contribution stats ───────────────────────────────────────────────────
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statBox: {
    flex: 1,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, color: D.secondary },
  statLabel: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  // ── Previous contribution ────────────────────────────────────────────────
  contribCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderLeftWidth: 3,
    borderLeftColor: D.primary,
    padding: Spacing.md,
    gap: 6,
  },
  cardPressed: { opacity: 0.85 },
  approvedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvedBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.primary, letterSpacing: 0.3 },
  contribTitle: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },

  // ── Press feedback ───────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
