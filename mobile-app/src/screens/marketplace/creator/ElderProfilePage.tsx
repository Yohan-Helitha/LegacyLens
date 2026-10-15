import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CreatorTopAppBar } from '../../../components/CreatorTopAppBar';
import { PersonPhoto } from '../../../components/module-specific/marketplace/PersonPhoto';
import { opportunityApi } from '../../../services/api/opportunityApi';
import { resolveAvatarImage } from '../../../utils/opportunityImages';
import type { ElderProfileResponse } from '../../../types/opportunity';

const D = {
  surface: '#EDEFEE',
  card: '#ffffff',
  primary: '#0F5C5C',
  secondary: '#E8792E',
  onSurface: '#202428',
  onSurfaceVariant: '#4a5568',
  chip: '#e4efef',
} as const;

const memberSinceLabel = (iso: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

/** A knowledge holder's public profile - only what the backend says about them, never made-up details. */
export const ElderProfilePage: React.FC<{
  opportunityId: string;
  onBack: () => void;
  onNavigate: (tab: NavTab) => void;
}> = ({ opportunityId, onBack, onNavigate }) => {
  const [profile, setProfile] = useState<ElderProfileResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    opportunityApi
      .getElderProfile(opportunityId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [opportunityId, attempt]);

  const since = profile ? memberSinceLabel(profile.memberSince) : null;

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />
      <CreatorTopAppBar variant="back" onBack={onBack} />

      {!profile ? (
        <View style={s.center}>
          {failed ? (
            <View style={s.errorBox}>
              <Text style={s.errorTitle}>{"Couldn't load this profile"}</Text>
              <Text style={s.errorText}>Check your connection and try again.</Text>
              <Pressable
                onPress={() => setAttempt((n) => n + 1)}
                style={({ pressed }) => [s.errorBtn, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityLabel="Try loading this profile again"
              >
                <Text style={s.errorBtnText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <ActivityIndicator size="large" color={D.primary} />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.headerCard}>
            <PersonPhoto name={profile.name} source={resolveAvatarImage(profile.avatarUrl)} size={96} />
            <Text style={s.name}>{profile.name}</Text>
            {profile.verified && (
              <View style={s.verifiedRow}>
                <Text style={s.verifiedStar}>{'✦'}</Text>
                <Text style={s.verifiedText}>Verified Knowledge holder</Text>
              </View>
            )}
            {!!profile.location && <Text style={s.location}>{profile.location}</Text>}
          </View>

          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statValue}>
                {profile.averageRating != null && profile.ratingCount > 0 ? `${Number(profile.averageRating).toFixed(1)} ★` : '—'}
              </Text>
              <Text style={s.statLabel}>{profile.ratingCount > 0 ? `${profile.ratingCount} rating${profile.ratingCount === 1 ? '' : 's'}` : 'Not rated yet'}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.stat}>
              <Text style={s.statValue}>{profile.openOpportunities}</Text>
              <Text style={s.statLabel}>Open opportunities</Text>
            </View>
          </View>

          {!!profile.bio && (
            <View style={s.section}>
              <Text style={s.sectionHeading}>About</Text>
              <Text style={s.body}>{profile.bio}</Text>
            </View>
          )}

          {profile.topics.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionHeading}>Can speak about</Text>
              <View style={s.chipRow}>
                {profile.topics.map((topic) => (
                  <View key={topic} style={s.chip}>
                    <Text style={s.chipText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!!since && <Text style={s.since}>{`On Legacy Lens since ${since}`}</Text>}
        </ScrollView>
      )}

      <BottomNavBar activeTab="market" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default ElderProfilePage;

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  headerCard: {
    backgroundColor: D.card, borderRadius: Radii.xl, padding: Spacing.lg, alignItems: 'center', gap: 6,
  },
  name: { fontFamily: Typography.fontDisplay, fontSize: 22, color: D.primary, textAlign: 'center', marginTop: Spacing.sm },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedStar: { color: D.secondary, fontSize: 14 },
  verifiedText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  location: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
  statsRow: {
    flexDirection: 'row', backgroundColor: D.card, borderRadius: Radii.xl, paddingVertical: Spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#a0c4c4' },
  statValue: { fontFamily: Typography.fontDisplay, fontSize: 20, color: D.secondary },
  statLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },
  section: { backgroundColor: D.card, borderRadius: Radii.xl, padding: Spacing.md, gap: Spacing.sm },
  sectionHeading: { fontFamily: Typography.fontDisplay, fontSize: 17, color: D.primary },
  body: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurface },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: D.chip, borderRadius: Radii.full, paddingVertical: 6, paddingHorizontal: 12 },
  chipText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.primary },
  since: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, textAlign: 'center' },
  errorBox: { alignItems: 'center', gap: Spacing.sm },
  errorTitle: { fontFamily: Typography.fontDisplay, fontSize: 18, color: '#B3261E' },
  errorText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, textAlign: 'center' },
  errorBtn: {
    minHeight: 44, paddingHorizontal: 20, borderRadius: Radii.full, borderWidth: 1.5, borderColor: '#B3261E',
    alignItems: 'center', justifyContent: 'center',
  },
  errorBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#B3261E' },
});
