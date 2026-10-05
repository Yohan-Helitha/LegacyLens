import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { Avatar } from '../../common';
import { useHireStrings } from '../../../hooks/useHireStrings';
import type { RecommendedCreator } from '../../../types/creatorRecommendation';
import { Typography, Spacing, Radii } from '../../../theme';
import { HireActionButton } from './HireActionButton';
import { RatingStars } from './RatingStars';
import { ContentCaptureColors as D } from './tokens';
import { languageWithLevel } from '../../../utils/creatorLanguages';

interface CreatorProfileSheetProps {
  /** The creator to show; the sheet is hidden while this is null. */
  creator: RecommendedCreator | null;
  busy?: boolean;
  onClose: () => void;
  onChoose?: (creator: RecommendedCreator) => void;
}

/**
 * "View profile" on the recommendation screen — a bottom sheet with the
 * creator's full details, so the elder can read everything in one calm place
 * and choose from there without going back to the list.
 */
export const CreatorProfileSheet: React.FC<CreatorProfileSheetProps> = ({ creator, busy = false, onClose, onChoose }) => {
  const { t, formatRating } = useHireStrings();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={creator !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('recommend.profile.close')}
        />

        {creator && (
          <View style={[s.sheet, { paddingBottom: insets.bottom + Spacing.md }]}>
            <View style={s.topRow}>
              <View style={s.handle} />
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('recommend.profile.close')}
                style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.7 }]}
              >
                <X size={26} color={D.onSurface} strokeWidth={2.25} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
              <View style={s.identity}>
                <Avatar uri={creator.avatarUrl} size={88} />
                <Text style={s.name} accessibilityRole="header">
                  {creator.name}
                </Text>
                <RatingStars
                  rating={creator.rating}
                  ratingText={creator.rating == null ? '' : formatRating(creator.rating)}
                  emptyText={t('applicants.noRating')}
                  accessibilityLabel={
                    creator.rating == null
                      ? t('applicants.noRating')
                      : t('applicants.rating', { rating: formatRating(creator.rating) })
                  }
                  size={22}
                />
                <Text style={s.meta}>{t('recommend.completedJobs', { count: creator.completedJobs })}</Text>
              </View>

              {!!creator.specialty && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>{t('recommend.profile.specialty')}</Text>
                  <Text style={s.body}>{creator.specialty}</Text>
                </View>
              )}

              {creator.languages.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>{t('recommend.profile.languages')}</Text>
                  <Text style={s.body}>
                    {creator.languages.map((entry) => languageWithLevel(entry, (level) => t(`recommend.level.${level}`))).join(', ')}
                  </Text>
                </View>
              )}

              <View style={s.section}>
                <Text style={s.sectionTitle}>{t('recommend.profile.about')}</Text>
                <Text style={s.body}>{creator.about?.trim() || t('recommend.profile.noAbout')}</Text>
              </View>

              {creator.reasons.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>{t('recommend.whyTitle')}</Text>
                  {creator.reasons.map((reason) => (
                    <View key={reason} style={s.reasonRow}>
                      <View style={s.reasonTick}>
                        <Check size={14} color={D.onPrimary} strokeWidth={3} />
                      </View>
                      <Text style={s.body}>{reason}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <HireActionButton
              label={busy ? t('recommend.choosing') : t('recommend.choose')}
              accessibilityLabel={t('recommend.chooseAccessibility', { name: creator.name })}
              size="large"
              loading={busy}
              onPress={() => onChoose?.(creator)}
              style={s.chooseBtn}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24,28,30,0.55)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: D.surfaceContainerLowest,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  topRow: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: D.outlineVariant },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { gap: Spacing.lg, paddingBottom: Spacing.md },
  identity: { alignItems: 'center', gap: 6 },
  name: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    lineHeight: 32,
    color: D.onSurface,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  meta: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    lineHeight: 22,
    color: D.onSurfaceVariant,
  },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 17,
    lineHeight: 24,
    color: D.secondary,
  },
  body: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 17,
    lineHeight: 26,
    color: D.onSurface,
  },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reasonTick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: D.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  chooseBtn: { marginTop: Spacing.sm },
});

export default CreatorProfileSheet;
