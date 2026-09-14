// src/screens/learning/CertificateScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Path, Polygon } from 'react-native-svg';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { apiGet } from '../../services/api/client';

type CertificateData = {
  trackId: number;
  trackTitle: string;
  learnerName: string;
  completionDate: string;
};

type NavigationProp = NativeStackNavigationProp<LearningStackParamList, 'Certificate'>;

/** Gradient medallion seal — teal-to-mango, with a small ribbon underneath. */
function MedallionSeal() {
  return (
    <View style={styles.medallionWrap}>
      <Svg width={72} height={92} viewBox="0 0 72 92">
        <Defs>
          <LinearGradient id="medallion" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Colors.accent} />
            <Stop offset="1" stopColor={Colors.secondary} />
          </LinearGradient>
        </Defs>
        {/* ribbon tails */}
        <Polygon points="24,56 24,90 36,80 48,90 48,56" fill={Colors.secondaryDark} />
        {/* medallion */}
        <Circle cx="36" cy="34" r="30" fill="url(#medallion)" />
        <Circle cx="36" cy="34" r="23" fill="none" stroke={Colors.white} strokeWidth={2} opacity={0.85} />
        <Path
          d="M36 22 L39.4 30.2 L48 31 L41.5 36.8 L43.5 45.5 L36 40.8 L28.5 45.5 L30.5 36.8 L24 31 L32.6 30.2 Z"
          fill={Colors.white}
        />
      </Svg>
    </View>
  );
}

/** Small corner flourish, rotated per-corner via the `rotate` prop. */
function CornerFlourish({ rotate = '0deg' }: { rotate?: string }) {
  return (
    <View style={[styles.cornerFlourish, { transform: [{ rotate }] }]}>
      <Svg width={28} height={28} viewBox="0 0 28 28">
        <Path
          d="M2 2 L2 14 Q2 2 14 2 Z"
          fill="none"
          stroke={Colors.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Circle cx="2" cy="2" r="2.5" fill={Colors.accent} />
      </Svg>
    </View>
  );
}

export default function CertificateScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<LearningStackParamList, 'Certificate'>>();

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const data = await apiGet<CertificateData>(
          `/learning/certificates/me/tracks/${route.params.trackId}`
        );
        setCertificate(data);
      } catch (error: any) {
        setErrorMessage(error?.message ?? 'Could not load your certificate.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [route.params.trackId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Loading certificate...</Text>
      </View>
    );
  }

  if (errorMessage || !certificate) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Certificate of Completion</Text>
        <View style={styles.emptyIconWrap}>
          <Text style={styles.emptyIcon}>🔒</Text>
        </View>
        <Text style={styles.emptyText}>
          {errorMessage ?? 'Complete this track to earn your certificate.'}
        </Text>
        <Pressable
          style={styles.backLink}
          onPress={() => navigation.navigate('TrackDetail', { trackId: route.params.trackId })}
        >
          <Text style={styles.backLinkText}>Back to Track</Text>
        </Pressable>
      </View>
    );
  }

  const { learnerName, trackTitle, completionDate } = certificate;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Certificate of Completion</Text>

      <View style={styles.certificateCard}>
        <View style={styles.innerBorder}>
          <CornerFlourish rotate="0deg" />
          <CornerFlourish rotate="90deg" />
          <View style={[styles.cornerBR]}>
            <CornerFlourish rotate="180deg" />
          </View>
          <View style={[styles.cornerBL]}>
            <CornerFlourish rotate="270deg" />
          </View>

          <Text style={styles.eyebrow}>LEGACY LENS</Text>
          <Text style={styles.certTitle}>Certificate of Completion</Text>
          <View style={styles.divider} />

          <Text style={styles.awardedTo}>This certifies that</Text>
          <Text style={styles.learnerName}>{learnerName}</Text>

          <Text style={styles.bodyText}>
            has successfully completed the{'\n'}
            <Text style={styles.trackName}>{trackTitle}</Text> track
          </Text>

          <MedallionSeal />

          <Text style={styles.date}>{completionDate}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
          <Text style={styles.actionButtonText}>⬇ Download</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.actionButtonPressed]}>
          <Text style={styles.actionButtonOutlineText}>↗ Share</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.backLink}
        onPress={() => navigation.navigate('TrackDetail', { trackId: route.params.trackId })}
      >
        <Text style={styles.backLinkText}>Back to Track</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.dominant,
    paddingTop: 50,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg - 4,
    alignItems: 'center',
  },
  header: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },

  // Outer card = soft elevated teal frame; inner border = the "paper"
  certificateCard: {
    width: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.xl + 4,
    padding: Spacing.xs + 2,
    marginBottom: Spacing.lg,
    shadowColor: Colors.secondaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  innerBorder: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: Colors.accentSubtle,
    paddingVertical: Spacing.xl - 4,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },

  cornerFlourish: { position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  cornerBR: { position: 'absolute', bottom: Spacing.sm, right: Spacing.sm, top: undefined, left: undefined },
  cornerBL: { position: 'absolute', bottom: Spacing.sm, left: Spacing.sm, top: undefined },

  eyebrow: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS - 1,
    letterSpacing: 3,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  certTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 3,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  awardedTo: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  learnerName: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: Colors.accent,
    marginBottom: Spacing.sm + 2,
    textAlign: 'center',
  },
  bodyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS + 1,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  trackName: { fontFamily: Typography.fontBodySemi, color: Colors.text },

  medallionWrap: { marginBottom: Spacing.sm },

  date: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  actionsRow: { flexDirection: 'row', gap: Spacing.sm + 2, width: '100%', marginBottom: Spacing.sm + 2 },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonOutline: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg + 2,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    paddingVertical: Spacing.sm + 6,
    alignItems: 'center',
  },
  actionButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  actionButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  actionButtonOutlineText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },

  backLink: { paddingVertical: Spacing.xs + 2 },
  backLinkText: { color: Colors.accent, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS + 1 },

  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyIcon: { fontSize: 28 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', fontFamily: Typography.fontBody, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
});