import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F3',
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
  },
  commentBubble: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  commentAuthor: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeMD,
    fontWeight: '600',
    color: Colors.text,
  },
  commentTime: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.textMuted,
  },
  commentText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    lineHeight: 22,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F3',
    backgroundColor: Colors.white,
  },
  currentUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F7',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#E1E3E2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    color: Colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    paddingLeft: Spacing.sm,
    paddingVertical: 4,
  },
});
