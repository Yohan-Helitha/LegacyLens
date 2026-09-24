import React from 'react';
import {
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

// ─────────────────────────────────────────────────────────────────────────────
// Local design tokens (mapped 1:1 from code.html's Tailwind custom colours)
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:          '#F8F6F0',   // warm off-white page background
  surfaceCardWhite: '#ffffff',

  teal:       '#356770',         // text/bg-teal-custom
  orange:     '#E77C38',         // text/bg-orange-custom
  orangeSoftBorder: '#F0DAC2',   // border-orange-custom (outline buttons)
  orangeBorder100:  '#FFEDD5',   // border-orange-100 (request card)
  orangeBorder200:  '#FED7AA',   // border-orange-200 (info box)
  orangeTint:       'rgba(255, 247, 237, 0.5)', // bg-orange-50/30
  tealBullet: '#0F766E',         // text-teal-700 (reason bullets)

  textDark:  '#1F2937',          // gray-800
  textMed:   '#374151',          // gray-700
  textMuted: '#6B7280',          // gray-500

  onlineDot: '#22C55E',          // green-500 notification dot
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — mirrors the two creators shown in code.html
// ─────────────────────────────────────────────────────────────────────────────
const BEST_MATCH = {
  name: 'Arani Inothma',
  avatarUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD8xxRMlkKSh7wVaFicqeQNDz2cQ6k2SElty4lJNc51iIfOIHUN5Y3Dw3TIOybmY9RwoNNgD15FxqZFN6DmSzwfZAIncNvyIL_fViqcTnz6OdPbWrmnRyIzAWdijnnd-cc5VyDzX_EzbadUfpCM4TnFdTmc848KHc45DXLZ7IWk9vrLALPCfznMI6VY3jJr_yt7EKhygMwAAW93JMHVH0KOgWf2G9ezif19RgUkA8lxQ9-IhhuLeATE8g',
  rating: 4.8,
  completedJobs: 24,
  specialty: 'Video Documentation',
  languages: 'Sinhala & English',
  quote: 'Has experience documenting traditional foods and community stories',
  reasons: [
    'Can make High-Quality video.',
    'Speak Sinhala.',
    'Experience with food related work.',
  ],
};

const OTHER_MATCH = {
  name: 'Ayesh Fernando',
  avatarUri:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDOJhdGTRViVen-lBy6K14NN4VZ94u9_-S-49BgocYBkhpG5CNxQ4mygJQ_MfOi9YCvDLiDFim53P6BYfsfLBepqSFlsdPC37E5F_SzPFpNO13y8-NWbx-ixpkbRL_p6kEDvowVvKoEPqMN-SeMedKm6kbECX_JmRIZ_I2YHRmyyP3rSrQaqhPndXyoUSFSgHCOT0v3KlI1_WbM4rlEbt4yO1K9tprniX43ZbNLDblhjecGePuxFQSGnA',
  rating: 4.7,
  completedJobs: 20,
};

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar — hamburger + title + bell (with an unread/online dot)
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

    <Text style={s.appBarTitle}>LegacyLens</Text>

    <Pressable
      style={({ pressed }) => [s.appBarIconBtn, pressed && s.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
        <View style={s.onlineDot} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// RequestMetaItem — small icon + label used in the "Your Request" card
// ─────────────────────────────────────────────────────────────────────────────
const RequestMetaItem: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <View style={s.requestMetaItem}>
    <Text style={s.requestMetaIcon}>{icon}</Text>
    <Text style={s.requestMetaLabel}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const CreatorSuggestions: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onChooseCreator?: () => void;
  onViewProfile?: () => void;
  onChooseOtherCreator?: () => void;
  onViewOtherProfile?: () => void;
}> = ({ onNavigate, onChooseCreator, onViewProfile, onChooseOtherCreator, onViewOtherProfile }) => {
  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <View style={s.introBlock}>
          <Text style={s.introTitle}>We found people who can help you !</Text>
          <Text style={s.introSubtitle}>
            Based on what you told us, these creators may be a good match.
          </Text>
        </View>

        {/* ── Your Request card ────────────────────────────────────────── */}
        <View style={s.requestCard}>
          <Text style={s.requestLabel}>Your Request:</Text>
          <Text style={s.requestTitle}>Traditional Food Recipe Documentation.</Text>
          <View style={s.requestMetaRow}>
            <RequestMetaItem icon={'🎥'} label="Video" />
            <RequestMetaItem icon={'📍'} label="Matara" />
            <RequestMetaItem icon={'🎤'} label="Sinhala" />
          </View>
        </View>

        {/* ── Best Match card ──────────────────────────────────────────── */}
        <View style={s.bestMatchCard}>
          <View style={s.bestMatchBadge}>
            <Text style={s.bestMatchBadgeText}>Best Match</Text>
          </View>

          <View style={s.bestMatchHeader}>
            <View style={s.bestMatchHeaderLeft}>
              <Image
                source={{ uri: BEST_MATCH.avatarUri }}
                style={s.bestMatchAvatar}
                accessibilityLabel={`${BEST_MATCH.name} profile photo`}
              />
              <View style={{ flexShrink: 1 }}>
                <Text style={s.bestMatchName}>{BEST_MATCH.name}</Text>
                <Text style={s.bestMatchJobs}>{BEST_MATCH.completedJobs} completed Jobs</Text>
                <Text style={s.bestMatchDetail}>{BEST_MATCH.specialty}</Text>
                <Text style={s.bestMatchDetail}>{BEST_MATCH.languages}</Text>
              </View>
            </View>
            <View style={s.ratingRow}>
              <Text style={s.ratingValue}>{BEST_MATCH.rating}</Text>
              <Text style={s.ratingStar}>{'★'}</Text>
            </View>
          </View>

          {/* Inner reasoning box */}
          <View style={s.reasonBox}>
            <Text style={s.reasonQuote}>{`“${BEST_MATCH.quote}”`}</Text>
            <Text style={s.reasonPrompt}>Why we recommended this person?</Text>
            <View style={{ gap: 2 }}>
              {BEST_MATCH.reasons.map((reason) => (
                <View key={reason} style={s.reasonRow}>
                  <Text style={s.reasonBullet}>{'•'}</Text>
                  <Text style={s.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: Spacing.sm }}>
            <Pressable
              onPress={onChooseCreator}
              style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${BEST_MATCH.name} as your creator`}
            >
              <Text style={s.primaryBtnText}>Choose this creator</Text>
            </Pressable>
            <Pressable
              onPress={onViewProfile}
              style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`View ${BEST_MATCH.name}'s profile`}
            >
              <Text style={s.outlineBtnText}>View Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Other Recommendations ────────────────────────────────────── */}
        <View style={s.otherSection}>
          <Text style={s.otherSectionTitle}>Other Recommendations</Text>

          <View style={s.otherCard}>
            <View style={s.otherCardHeader}>
              <Image
                source={{ uri: OTHER_MATCH.avatarUri }}
                style={s.otherAvatar}
                accessibilityLabel={`${OTHER_MATCH.name} profile photo`}
              />
              <View style={{ flexShrink: 1 }}>
                <Text style={s.otherName}>{OTHER_MATCH.name}</Text>
                <View style={s.otherMetaRow}>
                  <View style={s.ratingRow}>
                    <Text style={s.otherRatingValue}>{OTHER_MATCH.rating}</Text>
                    <Text style={s.otherRatingStar}>{'★'}</Text>
                  </View>
                  <Text style={s.otherJobs}>{OTHER_MATCH.completedJobs} completed Jobs</Text>
                </View>
              </View>
            </View>

            <View style={s.otherActionsRow}>
              <Pressable
                onPress={onChooseOtherCreator}
                style={({ pressed }) => [s.outlineBtn, s.otherActionBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Choose ${OTHER_MATCH.name} as your creator`}
              >
                <Text style={s.outlineBtnText}>Choose</Text>
              </Pressable>
              <Pressable
                onPress={onViewOtherProfile}
                style={({ pressed }) => [s.primaryBtn, s.otherActionBtn, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`View ${OTHER_MATCH.name}'s profile`}
              >
                <Text style={s.primaryBtnText}>View Profile</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      <BottomNavBar activeTab="home" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default CreatorSuggestions;

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
    backgroundColor: D.surfaceCardWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: D.teal,
    fontWeight: '600',
  },
  hamburger:     { gap: 4 },
  hamburgerLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: D.teal },
  bellWrapper:   { alignItems: 'center' },
  bellTop:       { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.teal, marginBottom: 1 },
  bellBody:      { width: 14, height: 13, borderWidth: 1.5, borderColor: D.teal, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper:   { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.teal },
  onlineDot: {
    position: 'absolute', top: -1, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: D.onlineDot,
    borderWidth: 1.5, borderColor: '#ffffff',
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  // ── Intro ──────────────────────────────────────────────────────────────────
  introBlock: { marginBottom: Spacing.md },
  introTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,      // 14sp
    color: D.textDark,
  },
  introSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: D.textMuted,
    marginTop: 2,
  },

  // ── Your Request card ──────────────────────────────────────────────────────
  requestCard: {
    backgroundColor: D.surfaceCardWhite,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: D.orangeBorder100,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  requestLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 11,
    color: D.textMuted,
    marginBottom: 4,
  },
  requestTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 14,
    color: D.textDark,
    marginBottom: Spacing.sm,
  },
  requestMetaRow: { flexDirection: 'row', gap: Spacing.md },
  requestMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requestMetaIcon: { fontSize: 15 },
  requestMetaLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 12,
    color: D.textMed,
  },

  // ── Best Match card ────────────────────────────────────────────────────────
  bestMatchCard: {
    backgroundColor: D.surfaceCardWhite,
    borderRadius: 20,
    paddingTop: Spacing.lg + 4,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: Spacing.md,
  },
  bestMatchBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: D.orange,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bestMatchBadgeText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 11,
    color: '#ffffff',
  },
  bestMatchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bestMatchHeaderLeft: { flexDirection: 'row', gap: Spacing.sm, flex: 1 },
  bestMatchAvatar: { width: 44, height: 44, borderRadius: 22 },
  bestMatchName: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 14,
    color: D.textDark,
    lineHeight: 18,
  },
  bestMatchJobs: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 12,
    color: D.textMed,
    marginTop: 2,
    marginBottom: 2,
  },
  bestMatchDetail: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: D.textMuted,
    lineHeight: 15,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingValue: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 14,
    color: D.textDark,
  },
  ratingStar: { fontSize: 13, color: D.textDark },

  // ── Reason box ─────────────────────────────────────────────────────────────
  reasonBox: {
    borderWidth: 1,
    borderColor: D.orangeBorder200,
    backgroundColor: D.orangeTint,
    borderRadius: Radii.md,
    padding: Spacing.sm + 2,
    gap: 6,
  },
  reasonQuote: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 12,
    color: D.textDark,
    lineHeight: 16,
  },
  reasonPrompt: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: D.textMed,
  },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  reasonBullet: { fontSize: 11, color: D.tealBullet, lineHeight: 15 },
  reasonText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: D.tealBullet,
    lineHeight: 15,
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: D.teal,
    borderRadius: Radii.full,
    minHeight: 44,                    // 44pt touch target
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    shadowColor: D.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
  primaryBtnText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 13,
    color: '#ffffff',
  },
  outlineBtn: {
    backgroundColor: D.surfaceCardWhite,
    borderWidth: 1,
    borderColor: D.orangeSoftBorder,
    borderRadius: Radii.full,
    minHeight: 44,                    // 44pt touch target
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  outlineBtnText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 13,
    color: D.orange,
  },

  // ── Other Recommendations ─────────────────────────────────────────────────
  otherSection: { gap: Spacing.sm },
  otherSectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 13,
    color: D.textDark,
    marginLeft: 2,
  },
  otherCard: {
    backgroundColor: D.surfaceCardWhite,
    borderRadius: 20,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
    gap: Spacing.sm,
  },
  otherCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  otherAvatar: { width: 44, height: 44, borderRadius: 22 },
  otherName: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 13,
    color: D.textDark,
    lineHeight: 17,
  },
  otherMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3 },
  otherRatingValue: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 11,
    color: D.textDark,
  },
  otherRatingStar: { fontSize: 10, color: D.textDark },
  otherJobs: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 11,
    color: D.textMed,
  },
  otherActionsRow: { flexDirection: 'row', gap: Spacing.sm },
  otherActionBtn: { flex: 1 },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.8 },
});
