import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mic, Video, BookOpen } from 'lucide-react-native';
import { BackButton } from '../../components/common';
import { MethodChoiceCard, ContentCaptureColors as D } from '../../components/module-specific/content-capture';
import { Typography, Spacing, Radii } from '../../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface RecordMethodSelectProps {
  onBack?: () => void;
  /** User chose to speak or film their story */
  onSelectVoiceVideo?: () => void;
  /** User chose to type their story instead */
  onSelectWriting?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// IconBubble — small decorative circle, purely presentational
// ─────────────────────────────────────────────────────────────────────────────
const IconBubble: React.FC<{ children: React.ReactNode; tint?: 'teal' | 'orange' }> = ({ children, tint }) => (
  <View style={[s.bubble, tint === 'teal' && s.bubbleTeal, tint === 'orange' && s.bubbleOrange]}>{children}</View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const RecordMethodSelect: React.FC<RecordMethodSelectProps> = ({
  onBack,
  onSelectVoiceVideo,
  onSelectWriting,
}) => {
  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={s.topBar}>
        <BackButton onPress={onBack} />
      </View>

      <View style={s.content}>
        <View style={s.heading}>
          <Text style={s.headline}>Share your story</Text>
          <Text style={s.subheadline}>Choose how you'd like to tell it</Text>
        </View>

        <View style={{ gap: Spacing.md }}>
          <MethodChoiceCard
            icon={
              <>
                <IconBubble tint="teal">
                  <Mic size={26} color={D.primary} strokeWidth={2} />
                </IconBubble>
                <Text style={s.slash}>/</Text>
                <IconBubble tint="teal">
                  <Video size={26} color={D.primary} strokeWidth={2} />
                </IconBubble>
              </>
            }
            label="By voice or video"
            onPress={onSelectVoiceVideo}
            accessibilityLabel="Share your story by voice or video"
          />

          <MethodChoiceCard
            icon={
              <IconBubble tint="orange">
                <BookOpen size={26} color={D.secondary} strokeWidth={2} />
              </IconBubble>
            }
            label="In writing"
            onPress={onSelectWriting}
            accessibilityLabel="Share your story in writing"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  topBar: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },

  heading: { alignItems: 'center', marginBottom: Spacing.md },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: D.onSurface,
    marginBottom: Spacing.xs,
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: D.onSurfaceVariant,
  },

  bubble: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: D.surfaceContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleTeal: {
    backgroundColor: 'rgba(15,92,92,0.10)',
    borderColor: 'rgba(15,92,92,0.25)',
  },
  bubbleOrange: {
    backgroundColor: 'rgba(254,137,62,0.14)',
    borderColor: 'rgba(254,137,62,0.32)',
  },
  slash: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeLG,
    color: D.onSurfaceVariant,
  },
});

export default RecordMethodSelect;
