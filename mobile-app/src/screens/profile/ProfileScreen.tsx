import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Avatar,
  BottomNavBar,
  RoleUpgradeCard,
  SettingsListRow,
  StatCard,
} from '../../components/common';
import type { NavTab } from '../../components/common';
import { profileApi } from '../../services/api/profileApi';
import { useAuthStore } from '../../store/authStore';
import { UserProfile } from '../../types/profile';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import {
  Bell,
  Briefcase,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  Mic,
  Settings,
} from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ProfileScreenProps {
  onOpenPrivacyData?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onTabPress?: (tab: NavTab) => void;
  /** "Become a Freelancer" card CTA — opens the creator application form. */
  onBecomeFreelancer?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Rough completeness score based on which optional fields are filled in. */
function profileCompleteness(profile: UserProfile): number {
  const fields = [profile.profilePhotoUrl, profile.city, profile.phoneVerified];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenPrivacyData,
  onOpenSettings,
  onLogout,
  onTabPress,
  onBecomeFreelancer,
}) => {
  const cachedUser = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getMe()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        // Non-fatal — the header falls back to cached auth-store data below.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = profile?.fullName ?? cachedUser?.fullName ?? '';
  const cityLabel = profile?.city
    ? [profile.city.name, profile.city.region].filter(Boolean).join(', ')
    : null;
  const memberSince = profile?.createdAt ? formatMemberSince(profile.createdAt) : null;
  const completeness = profile ? profileCompleteness(profile) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" backgroundColor={Colors.dominant} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Text style={styles.appName}>Legacy Lens</Text>
          <SettingsGear onPress={onOpenSettings} />
        </View>

        <View style={styles.profileHeader}>
          <Avatar uri={profile?.profilePhotoUrl} editable size={128} />
          <Text style={styles.name}>{displayName}</Text>
          {(cityLabel || memberSince) && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.locationText}>
                {[cityLabel, memberSince && `Member since ${memberSince}`]
                  .filter(Boolean)
                  .join('  •  ')}
              </Text>
            </View>
          )}

          {!loading && profile && (
            <View style={styles.completenessCard}>
              <View style={styles.completenessTop}>
                <Text style={styles.completenessLabel}>
                  Profile {completeness}% complete
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completeness}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* ── Activity snapshot (static placeholders — no backend yet) ─────── */}
        <View style={styles.statsRow}>
          <StatCard value={12} label="day streak" />
          <StatCard value={8} label="lessons completed" />
          <StatCard value={5} label="saved stories" />
        </View>

        {/* ── Role upgrade ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grow your role in the community</Text>
          <View style={styles.upgradeCards}>
            <RoleUpgradeCard
              icon={Mic}
              title="Become a Storyteller"
              description="Share your stories, dialects, and traditions with the community."
              hint="No experience needed — record however feels comfortable."
            />
            <RoleUpgradeCard
              icon={Briefcase}
              title="Become a Freelancer"
              description="Get hired by elders to help record and preserve their stories."
              hint="Earn credits and build your reputation."
              onPress={onBecomeFreelancer}
            />
          </View>
        </View>

        {/* ── Settings list ─────────────────────────────────────────────── */}
        <View style={styles.settingsCard}>
          <SettingsListRow icon={Globe} label="Language preference" />
          <SettingsListRow icon={Bell} label="Notification settings" />
          <SettingsListRow icon={Lock} label="Privacy & data" onPress={onOpenPrivacyData} />
          <SettingsListRow icon={HelpCircle} label="Help & support" />
          <SettingsListRow icon={LogOut} label="Log out" variant="danger" onPress={onLogout} />
        </View>
      </ScrollView>

      <BottomNavBar active="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

const SettingsGear: React.FC<{ onPress?: () => void }> = ({ onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel="Settings"
    hitSlop={8}
    style={styles.gearButton}
  >
    <Settings size={22} color={Colors.textMuted} strokeWidth={2} />
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dominant,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  appName: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.secondary,
    fontStyle: 'italic',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  gearButton: {
    padding: Spacing.sm,
  },

  profileHeader: {
    alignItems: 'center',
  },
  name: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXL,
    color: Colors.text,
    marginTop: Spacing.sm,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },

  completenessCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.4)',
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  completenessTop: {
    marginBottom: 8,
  },
  completenessLabel: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    color: Colors.secondary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  upgradeCards: {
    gap: Spacing.sm,
  },

  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 207, 0.4)',
    overflow: 'hidden',
  },
});

export default ProfileScreen;
