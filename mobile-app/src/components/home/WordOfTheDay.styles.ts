import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  wordCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondarySubtle,
  },
  wordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  wordTagText: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  wordBodyCol: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: Spacing.sm,
  },
  wordMainContainer: {
    alignItems: 'flex-start',
  },
  sinhalaWord: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.secondary,
  },
  transliteration: {
    fontFamily: Typography.fontBodyMed,
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    marginTop: 2,
  },
  definitionBox: {
    backgroundColor: '#F2F4F3',
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E1E3E2',
  },
  definitionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: Colors.text,
    lineHeight: 20,
  },
  wordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F2F4F3',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
