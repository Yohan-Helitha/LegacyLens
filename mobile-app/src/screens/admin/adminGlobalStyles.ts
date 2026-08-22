import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radii, Typography } from '../../theme';

/**
 * Global Stylesheet for Admin Screens
 * 
 * This acts as the React Native equivalent of a "global CSS" file for the admin pages.
 * You can import this into any Admin screen to maintain a consistent aesthetic 
 * without having to redefine common styles (like screen backgrounds, card styling, etc.)
 */
export const adminGlobalStyles = StyleSheet.create({
  // ─── Screens ─────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: '#eaf2f2', // Standard faint green tint for all admin screens
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  
  // ─── Cards ───────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(15,92,92,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  
  // ─── Typography ──────────────────────────────────────────────────────────
  pageTitle: {
    fontFamily: Typography.fontDisplay, 
    fontSize: Typography.size2XL - 4,
    fontWeight: '700', 
    color: Colors.text,
  },
  sectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    fontWeight: '600',
    color: Colors.text,
  },
  
  // ─── Layout Utils ────────────────────────────────────────────────────────
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
