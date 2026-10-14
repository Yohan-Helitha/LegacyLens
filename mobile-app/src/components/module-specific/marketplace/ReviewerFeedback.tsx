import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radii } from '../../../theme';
import { formatStamp } from '../../../utils/applicationDates';

const D = {
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#c8dcdc',
  primary:                '#0F5C5C',
  secondary:              '#E8792E',
  onSurface:              '#202428',
  onSurfaceVariant:       '#4a5568',
} as const;

const FeedbackBox: React.FC<{
  title: string;
  message: string | null | undefined;
  at: string | null | undefined;
  accent: string;
  showEmpty: boolean;
}> = ({ title, message, at, accent, showEmpty }) => {
  const hasMessage = !!message?.trim();
  if (!hasMessage && !showEmpty) return null;
  const when = formatStamp(at);

  return (
    <View style={[s.box, { borderLeftColor: accent }]}>
      <View style={s.boxHeader}>
        <Text style={s.boxTitle}>{title}</Text>
        {!!when && hasMessage && <Text style={s.boxDate}>{when}</Text>}
      </View>
      <Text style={hasMessage ? s.boxText : s.boxEmpty}>{hasMessage ? message : 'No feedback yet.'}</Text>
    </View>
  );
};

/**
 * What the two reviewers asked to change - the knowledge holder's note and the admin's. It is shown
 * to the creator only (My Work and Rejected Submissions), never in the published content. With
 * `showEmpty` both boxes always appear, saying "No feedback yet." when a reviewer wrote nothing.
 */
export const ReviewerFeedback: React.FC<{
  elderFeedback: string | null | undefined;
  elderFeedbackAt?: string | null;
  adminFeedback: string | null | undefined;
  adminFeedbackAt?: string | null;
  showEmpty?: boolean;
}> = ({ elderFeedback, elderFeedbackAt, adminFeedback, adminFeedbackAt, showEmpty = false }) => (
  <View style={s.wrap}>
    <FeedbackBox title="Knowledge holder feedback" message={elderFeedback} at={elderFeedbackAt} accent={D.secondary} showEmpty={showEmpty} />
    <FeedbackBox title="Admin feedback" message={adminFeedback} at={adminFeedbackAt} accent={D.primary} showEmpty={showEmpty} />
  </View>
);

export function hasReviewerFeedback(elderFeedback?: string | null, adminFeedback?: string | null): boolean {
  return !!elderFeedback?.trim() || !!adminFeedback?.trim();
}

const s = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  box: {
    backgroundColor: D.surfaceContainerLowest, borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.surfaceVariant, borderLeftWidth: 4,
    padding: Spacing.sm + 2, gap: 4,
  },
  boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boxTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: D.onSurface },
  boxDate: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant },
  boxText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 20, color: D.onSurface },
  boxEmpty: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant },
});
