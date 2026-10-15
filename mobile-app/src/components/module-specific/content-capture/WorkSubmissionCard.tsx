import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronRight, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PersonPhoto } from '../marketplace/PersonPhoto';
import { useLocaleStore } from '../../../store/localeStore';
import { formatTimeAgo } from '../../../utils/timeAgo';
import type { WorkSubmissionSummary } from '../../../types/workReview';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';

/** "You: approved" / "Admin: waiting" - who has signed the work off so far. */
const Approval: React.FC<{ label: string; done: boolean }> = ({ label, done }) => (
  <View style={[s.chip, done ? s.chipDone : s.chipWaiting]}>
    {done ? <Check size={12} color={D.onPrimary} strokeWidth={3} /> : <Clock size={12} color={D.onSurfaceVariant} strokeWidth={2.5} />}
    <Text style={[s.chipText, done && { color: D.onPrimary }]}>{label}</Text>
  </View>
);

/** One piece of submitted work in the review queue: what it is, who made it, when, and who has approved it. */
export const WorkSubmissionCard: React.FC<{
  item: WorkSubmissionSummary;
  onPress?: (item: WorkSubmissionSummary) => void;
}> = ({ item, onPress }) => {
  const { t } = useTranslation('contentCapture');
  const locale = useLocaleStore((state) => state.locale);
  const ago = formatTimeAgo(item.submittedAt, locale);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={t('submittedWork.openAria', { title: item.title, name: item.creatorName })}
      style={({ pressed }) => [s.card, pressed && s.pressed]}
    >
      <PersonPhoto name={item.creatorName} size={48} />
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {t('workDetail.by', { name: item.creatorName })}
          {ago ? ` · ${t('submittedWork.submittedAgo', { time: ago })}` : ''}
        </Text>
        <View style={s.chips}>
          <Approval label={t(item.elderApproved ? 'submittedWork.youApproved' : 'submittedWork.youWaiting')} done={item.elderApproved} />
          <Approval label={t(item.adminApproved ? 'submittedWork.adminApproved' : 'submittedWork.adminWaiting')} done={item.adminApproved} />
        </View>
      </View>
      <ChevronRight size={22} color={D.onSurfaceVariant} strokeWidth={2} />
    </Pressable>
  );
};

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.outlineVariant,
    padding: Spacing.md,
    minHeight: 88,
  },
  pressed: { opacity: 0.88 },
  body: { flex: 1, gap: 4 },
  title: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeLG, lineHeight: 26, color: D.onSurface },
  sub: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 21, color: D.onSurfaceVariant },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radii.full, paddingVertical: 3, paddingHorizontal: 10 },
  chipDone: { backgroundColor: D.primary },
  chipWaiting: { backgroundColor: D.surfaceVariant },
  chipText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, lineHeight: 16, color: D.onSurface },
});

export default WorkSubmissionCard;
