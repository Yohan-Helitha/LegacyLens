import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mic, Video, BookOpen } from 'lucide-react-native';
import { BackButton } from '../../components/common';
import { MethodChoiceCard, ContentCaptureColors as D } from '../../components/module-specific/content-capture';
import { Typography, Spacing, Radii } from '../../theme';
import type { StoryMediaType } from '../../types/story';

interface ChooseCaptureMethodScreenProps {
  onBack?: () => void;
  /** contentType is null for Written, since a written story has no media file — the transcript itself is the content. */
  onSelectMethod?: (contentType: StoryMediaType | null) => void;
}

const IconBubble: React.FC<{ children: React.ReactNode; tint: 'teal' | 'orange' }> = ({ children, tint }) => (
  <View style={[s.bubble, tint === 'teal' ? s.bubbleTeal : s.bubbleOrange]}>{children}</View>
);

/**
 * Three distinct, equally-weighted capture methods — Audio, Video, Written
 * — replacing the previous two-option (combined voice/video vs writing)
 * screen now that AudioRecordingScreen and VideoRecordingScreen are split
 * apart.
 */
export const ChooseCaptureMethodScreen: React.FC<ChooseCaptureMethodScreenProps> = ({
  onBack,
  onSelectMethod,
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
              <IconBubble tint="teal">
                <Mic size={26} color={D.primary} strokeWidth={2} />
              </IconBubble>
            }
            label="Audio"
            description="Speak and we'll record your voice"
            onPress={() => onSelectMethod?.('AUDIO')}
          />

          <MethodChoiceCard
            icon={
              <IconBubble tint="teal">
                <Video size={26} color={D.primary} strokeWidth={2} />
              </IconBubble>
            }
            label="Video"
            description="Record yourself on camera"
            onPress={() => onSelectMethod?.('VIDEO')}
          />

          <MethodChoiceCard
            icon={
              <IconBubble tint="orange">
                <BookOpen size={26} color={D.secondary} strokeWidth={2} />
              </IconBubble>
            }
            label="Written"
            description="Speak and we'll write it down for you"
            onPress={() => onSelectMethod?.(null)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

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
});

export default ChooseCaptureMethodScreen;
