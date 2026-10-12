// src/screens/learning/CertificateScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Path, Polygon } from 'react-native-svg';
import { ArrowLeft, Lock, Download, Share2, ShieldCheck } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearningStackParamList } from '../../navigation/LearningNavigator';
import { certificateApi } from '../../services/api/certificateApi';
import { IssuedCertificate } from '../../types/certificate';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

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

  const [certificate, setCertificate] = useState<IssuedCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const viewRef = useRef<View>(null);

  const handleDownloadShare = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Download / Share Certificate',
        });
      } else {
        Alert.alert('Success', 'Certificate image created, but sharing is not supported on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process certificate.');
    }
  };

  const handleVerify = async () => {
    if (!certificate?.verificationCode) return;
    try {
      setVerifying(true);
      const res = await certificateApi.verifyCertificate(certificate.verificationCode);
      if (res.valid) {
        Alert.alert(
          'Certificate Verified ✓',
          `Learner: ${res.learnerDisplayName}\nTrack: ${res.trackTitle}\nType: ${res.certificateType}\nIssued: ${res.issueDate}\nCode: ${res.verificationCode}`
        );
      } else {
        Alert.alert('Invalid Certificate', 'This certificate code could not be verified on the network.');
      }
    } catch (err: any) {
      Alert.alert('Verification Error', err.message || 'Could not verify certificate code.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const data = await certificateApi.getCertificateForTrack(route.params.trackId);
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
      <View style={styles.centerContainer}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButtonLoading}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading certificate...</Text>
      </View>
    );
  }

  if (errorMessage || !certificate) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.header}>Certificate of Completion</Text>
        </View>
        <View style={styles.emptyIconWrap}>
          <Lock size={30} color={Colors.textMuted} />
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

  const { learnerName, trackTitle, issueDate, verificationCode, certificateType } = certificate;
  const isAiCourse = certificateType === 'AI_COURSE';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.header}>Certificate of Completion</Text>
      </View>

      {/* Main Certificate Render Card */}
      <View ref={viewRef} collapsable={false} style={styles.certificateCard}>
        <View style={styles.innerBorder}>
          <CornerFlourish rotate="0deg" />
          <CornerFlourish rotate="90deg" />
          <View style={styles.cornerBR}>
            <CornerFlourish rotate="180deg" />
          </View>
          <View style={styles.cornerBL}>
            <CornerFlourish rotate="270deg" />
          </View>

          <Text style={styles.eyebrow}>LEGACY LENS</Text>
          <Text style={styles.certTitle}>Certificate of Completion</Text>

          {/* Certificate Type Pill */}
          <View style={[styles.certTypeBadge, isAiCourse && styles.certTypeBadgeAi]}>
            <Text style={[styles.certTypeBadgeText, isAiCourse && styles.certTypeBadgeTextAi]}>
              {isAiCourse
                ? 'Self-study certificate (AI-generated course)'
                : 'Curated Heritage Track Certificate'}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.awardedTo}>This certifies that</Text>
          <Text style={styles.learnerName}>{learnerName}</Text>

          <Text style={styles.bodyText}>
            has successfully completed the{'\n'}
            <Text style={styles.trackName}>{trackTitle}</Text> {isAiCourse ? 'course' : 'track'}
          </Text>

          <MedallionSeal />

          <Text style={styles.date}>Issued: {issueDate}</Text>

          {/* Embedded Verification Stamp */}
          <View style={styles.certStampBox}>
            <Text style={styles.certStampLabel}>VERIFICATION CODE</Text>
            <Text style={styles.certStampCode}>{verificationCode}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleDownloadShare}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        >
          <Download size={16} color={Colors.white} />
          <Text style={styles.actionButtonText}>Download</Text>
        </Pressable>
        <Pressable
          onPress={handleDownloadShare}
          style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.actionButtonPressed]}
        >
          <Share2 size={16} color={Colors.secondary} />
          <Text style={styles.actionButtonOutlineText}>Share</Text>
        </Pressable>
      </View>

      {/* Verification Card */}
      <View style={styles.verifyCard}>
        <View style={styles.verifyHeaderRow}>
          <ShieldCheck size={22} color={Colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.verifyCardTitle}>Public Verification</Text>
            <Text style={styles.verifyCardSubtitle}>
              Anyone can verify this credential using its unique code.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleVerify}
          disabled={verifying}
          style={styles.verifyCtaBtn}
        >
          {verifying ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.verifyCtaBtnText}>Verify Authenticity</Text>
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dominant,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.text,
    fontFamily: Typography.fontBodyMed,
  },
  backButtonLoading: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flex: 1,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeLG + 2,
    color: Colors.text,
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
  certTypeBadge: {
    backgroundColor: '#E6F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
    marginTop: 6,
  },
  certTypeBadgeAi: {
    backgroundColor: '#FDEEE9',
  },
  certTypeBadgeText: {
    fontSize: 11,
    fontFamily: Typography.fontBodySemi,
    color: Colors.secondaryDark,
  },
  certTypeBadgeTextAi: {
    color: Colors.accent,
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
    marginBottom: 8,
  },

  certStampBox: {
    backgroundColor: '#EDEFEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D2D7D6',
    alignItems: 'center',
    marginTop: 4,
  },
  certStampLabel: {
    fontSize: 9,
    fontFamily: Typography.fontBodySemi,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  certStampCode: {
    fontSize: 12,
    fontFamily: Typography.fontBodySemi,
    color: Colors.text,
    letterSpacing: 0.5,
  },

  actionsRow: { flexDirection: 'row', gap: Spacing.sm + 2, width: '100%', marginBottom: Spacing.sm + 2 },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg + 2,
    paddingVertical: Spacing.sm + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  actionButtonText: { color: Colors.white, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },
  actionButtonOutlineText: { color: Colors.secondary, fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM },

  verifyCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#D2D7D6',
  },
  verifyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  verifyCardTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
    color: Colors.text,
  },
  verifyCardSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: 2,
  },
  verifyCtaBtn: {
    backgroundColor: Colors.secondaryDark,
    borderRadius: Radii.md,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyCtaBtnText: {
    color: Colors.white,
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeSM,
  },

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
  emptyText: { color: Colors.textMuted, textAlign: 'center', fontFamily: Typography.fontBody, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
});