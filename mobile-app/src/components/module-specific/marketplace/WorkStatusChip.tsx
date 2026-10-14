import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Typography, Radii } from '../../../theme';
import type { WorkStatus } from '../../../types/workProgress';

const LOOK: Record<WorkStatus, { label: string; background: string; text: string }> = {
  IN_PROGRESS: { label: 'In Progress', background: '#FFF0E0', text: '#9E4A0D' },
  SAVED:       { label: 'Saved',       background: '#E3F1F0', text: '#0F5C5C' },
  SUBMITTED:   { label: 'Submitted',   background: '#E6EEF9', text: '#1F4E8C' },
  REJECTED:    { label: 'Rejected',    background: '#FDECEA', text: '#C0392B' },
  COMPLETED:   { label: 'Completed',   background: '#E3F3E8', text: '#2E7D4F' },
  PUBLISHED:   { label: 'Published',   background: '#E3F3E8', text: '#2E7D4F' },
};

/** The small pill that names where a piece of work stands. */
export const WorkStatusChip: React.FC<{ status: WorkStatus }> = ({ status }) => {
  const look = LOOK[status] ?? LOOK.IN_PROGRESS;
  return (
    <View style={[s.chip, { backgroundColor: look.background }]}>
      <Text style={[s.text, { color: look.text }]}>{look.label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  chip: { alignSelf: 'flex-start', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontFamily: Typography.fontBodySemi, fontSize: 10, letterSpacing: 0.3 },
});
