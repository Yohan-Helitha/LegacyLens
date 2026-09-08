import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography, Spacing, Radii } from '../theme';

/**
 * Shared "Legacy Lens" app bar used across almost every creator screen —
 * previously each screen defined its own copy of this exact bar (title,
 * bell icon, and either a hamburger or a back arrow), which meant the menu
 * drawer had to be reimplemented per screen. Now there's one definition, and
 * the drawer (currently just "My Work") only needs to be built once.
 *
 * `variant: 'back'` is for screens reached by drilling in from somewhere
 * else — the left icon becomes a back arrow instead of the menu, and no
 * drawer is rendered. `variant: 'menu'` is for the app's "root" screens
 * (the four bottom-nav tabs, plus a couple of screens with no natural
 * "back" target) and owns the side-menu drawer.
 */
type CreatorTopAppBarProps =
  | { variant: 'menu'; onOpenMyWork: () => void }
  | { variant: 'back'; onBack: () => void };

export const CreatorTopAppBar: React.FC<CreatorTopAppBarProps> = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={s.appBar}>
        {props.variant === 'menu' ? (
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <View style={s.hamburger}>
              <View style={s.hamburgerLine} />
              <View style={s.hamburgerLine} />
              <View style={s.hamburgerLine} />
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={props.onBack}
            style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={s.backArrow}>{'←'}</Text>
          </Pressable>
        )}

        <Text style={s.appBarTitle}>Legacy Lens</Text>

        <Pressable
          style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <View style={s.bellWrapper}>
            <View style={s.bellTop} />
            <View style={s.bellBody} />
            <View style={s.bellClapper} />
          </View>
        </Pressable>
      </View>

      {props.variant === 'menu' && (
        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <View style={s.menuOverlay}>
            <View style={s.menuPanel}>
              <View style={s.menuHeader}>
                <Text style={s.menuHeaderTitle}>Menu</Text>
                <Pressable
                  onPress={() => setMenuOpen(false)}
                  style={({ pressed }) => [s.menuCloseBtn, pressed && s.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                >
                  <Text style={s.menuCloseText}>{'✕'}</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  setMenuOpen(false);
                  props.onOpenMyWork();
                }}
                style={({ pressed }) => [s.menuItem, pressed && s.menuItemPressed]}
                accessibilityRole="button"
                accessibilityLabel="My Work"
              >
                <Text style={s.menuItemIcon}>{'📁'}</Text>
                <Text style={s.menuItemText}>My Work</Text>
              </Pressable>
            </View>
            <Pressable style={s.menuCloseArea} onPress={() => setMenuOpen(false)} />
          </View>
        </Modal>
      )}
    </>
  );
};

export default CreatorTopAppBar;

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same "Monsoon Coast" system used across every creator screen
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surfaceContainerLowest: '#ffffff',
  surfaceVariant: '#c8dcdc',
  primary: '#0F5C5C',
  onSurface: '#202428',
  onSurfaceVariant: '#4a5568',
} as const;

const s = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBtn: { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  hamburger: { gap: 4 },
  hamburgerLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: D.primary },
  bellWrapper: { alignItems: 'center' },
  bellTop: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody: { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper: { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },
  pressed: { opacity: 0.75 },

  // ── Side menu ────────────────────────────────────────────────────────────
  menuOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)' },
  menuPanel: {
    width: 260,
    height: '100%',
    backgroundColor: D.surfaceContainerLowest,
    paddingTop: 56,
    paddingHorizontal: Spacing.md,
  },
  menuCloseArea: { flex: 1 },
  menuHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: Spacing.md, marginBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: D.surfaceVariant,
  },
  menuHeaderTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeLG, color: D.primary },
  menuCloseBtn: { width: 32, height: 32, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  menuCloseText: { fontSize: 16, color: D.onSurfaceVariant },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: Radii.lg,
  },
  menuItemPressed: { opacity: 0.88 },
  menuItemIcon: { fontSize: 18 },
  menuItemText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeSM, color: D.onSurface },
});
