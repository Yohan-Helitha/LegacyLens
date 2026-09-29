import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { Typography } from '../../../theme';
import type { HireDisplayStatus } from '../../../types/hireRequest';
import { ContentCaptureColors as D } from './tokens';

interface HireStatusPillProps {
  status: HireDisplayStatus;
  /** Localized label — the pill never hard-codes copy. */
  label: string;
  accessibilityLabel?: string;
}

/**
 * The six request-status pills on My Requests (Screen 9). Each status is
 * distinguishable by more than colour alone — a clock/check icon or a
 * fill-vs-outline treatment — and the text label is always shown.
 */
export const HireStatusPill: React.FC<HireStatusPillProps> = ({ status, label, accessibilityLabel }) => {
  const variant = VARIANTS[status];

  return (
    <View
      style={[s.pill, variant.container]}
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {status === 'PENDING_REVIEW' && <Clock size={12} color={variant.textColor} strokeWidth={2.5} />}
      {status === 'COMPLETED' && <Check size={12} color={variant.textColor} strokeWidth={3} />}
      <Text style={[s.text, { color: variant.textColor }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </View>
  );
};

const VARIANTS: Record<HireDisplayStatus, { container: object; textColor: string }> = {
  // Waiting on admin — quiet grey outline
  PENDING_REVIEW: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: D.outline },
    textColor: D.onSurfaceVariant,
  },
  // Published, no applicants yet — soft teal tint
  OPEN: {
    container: { backgroundColor: 'rgba(15,92,92,0.10)', borderWidth: 1, borderColor: 'rgba(15,92,92,0.35)' },
    textColor: D.primary,
  },
  // Needs the elder's attention — mango-orange fill
  REVIEWING: {
    container: { backgroundColor: D.secondaryContainer },
    textColor: D.onSecondaryContainer,
  },
  ASSIGNED: {
    container: { backgroundColor: D.primary },
    textColor: D.onPrimary,
  },
  COMPLETED: {
    container: { backgroundColor: D.primaryContainer },
    textColor: D.onPrimary,
  },
  // Same muted clay as a story that "needs changes" — not a harsh error red
  NOT_APPROVED: {
    container: { backgroundColor: D.clay },
    textColor: '#ffffff',
  },
};

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeXS,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
});

export default HireStatusPill;
