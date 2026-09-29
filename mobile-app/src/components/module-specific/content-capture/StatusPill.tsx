import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Archive, Check } from 'lucide-react-native';
import { Typography } from '../../../theme';
import type { StoryStatus } from '../../../types/story';
import { ContentCaptureColors as D } from './tokens';

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending Review',
  PUBLISHED: 'Published',
  REJECTED: 'Needs changes',
  ARCHIVED: 'Archived',
};

interface StatusPillProps {
  status: StoryStatus;
}

/** The five story-status pills used throughout My Stories (Screen 6). */
export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const label = STORY_STATUS_LABELS[status];

  if (status === 'DRAFT') {
    return (
      <View style={[s.pill, s.draft]}>
        <Text style={[s.text, s.draftText]}>{label}</Text>
      </View>
    );
  }

  if (status === 'PUBLISHED') {
    return (
      <View style={[s.pill, s.published]}>
        <Check size={12} color={D.onPrimary} strokeWidth={3} />
        <Text style={[s.text, s.publishedText]}>{label}</Text>
      </View>
    );
  }

  if (status === 'REJECTED') {
    return (
      <View style={[s.pill, s.needsChanges]}>
        <Text style={[s.text, s.needsChangesText]}>{label}</Text>
      </View>
    );
  }

  if (status === 'ARCHIVED') {
    return (
      <View style={[s.pill, s.archived]}>
        <Archive size={12} color={D.onSurfaceVariant} strokeWidth={2.5} />
        <Text style={[s.text, s.archivedText]}>{label}</Text>
      </View>
    );
  }

  // PENDING
  return (
    <View style={[s.pill, s.pending]}>
      <Text style={[s.text, s.pendingText]}>{label}</Text>
    </View>
  );
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
  },

  draft: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: D.outline,
  },
  draftText: { color: D.onSurfaceVariant },

  pending: { backgroundColor: D.secondaryContainer },
  pendingText: { color: D.onSecondaryContainer },

  published: { backgroundColor: D.primary },
  publishedText: { color: D.onPrimary },

  needsChanges: { backgroundColor: D.clay },
  needsChangesText: { color: '#ffffff' },

  archived: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  archivedText: { color: D.onSurfaceVariant },
});

export default StatusPill;
