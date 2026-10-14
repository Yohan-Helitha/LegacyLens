import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, CircleX, ClipboardList, FileX, LogOut, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography, Spacing, Radii } from '../theme';
import { useAuthStore } from '../store/authStore';
import { ContentCaptureColors as E } from './module-specific/content-capture/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useCreatorMenu } from '../navigation/CreatorMenuContext';
import { badgeText } from '../utils/applicationGroups';

/** Same width rule as ElderNavDrawer, so both sides of the app feel like one product. */
const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.85, 360);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  | { variant: 'menu'; onOpenMyWork: () => void; onOpenSavedApplications: () => void; onOpenRejectedWork: () => void }
  | { variant: 'back'; onBack: () => void };

export const CreatorTopAppBar: React.FC<CreatorTopAppBarProps> = (props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { rejectedApplicationsCount, onOpenRejectedApplications } = useCreatorMenu();

  // Slide-in/out like ElderNavDrawer: stay mounted until the close animation finishes.
  const progress = useRef(new Animated.Value(0)).current;
  const [menuMounted, setMenuMounted] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      setMenuMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else if (menuMounted) {
      Animated.timing(progress, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setMenuMounted(false));
    }
  }, [menuOpen]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0] });

  const handleLogout = () => {
    setMenuOpen(false);
    useAuthStore.getState().clearSession();
    navigation.replace('Login');
  };

  const menuItems: { label: string; icon: LucideIcon; onPress: () => void; badge?: number }[] =
    props.variant === 'menu'
      ? [
          { label: 'My Work', icon: Briefcase, onPress: props.onOpenMyWork },
          { label: 'My Applications', icon: ClipboardList, onPress: props.onOpenSavedApplications },
          // Only offered where the creator navigator supplies it; the red number is how many were rejected.
          ...(onOpenRejectedApplications
            ? [{
                label: 'Rejected Applications',
                icon: CircleX,
                onPress: onOpenRejectedApplications,
                badge: rejectedApplicationsCount,
              }]
            : []),
          { label: 'Rejected Submissions', icon: FileX, onPress: props.onOpenRejectedWork },
        ]
      : [];

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
            {rejectedApplicationsCount > 0 && <View style={s.hamburgerDot} />}
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

      {props.variant === 'menu' && menuMounted && (
        <Modal visible transparent animationType="none" onRequestClose={() => setMenuOpen(false)} statusBarTranslucent>
          <View style={StyleSheet.absoluteFill}>
            <Animated.View style={[StyleSheet.absoluteFill, s.backdrop, { opacity: progress }]}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setMenuOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              />
            </Animated.View>

            <Animated.View
              style={[s.drawer, { width: DRAWER_WIDTH, paddingTop: insets.top + Spacing.md, transform: [{ translateX }] }]}
            >
              <View style={s.drawerHeader}>
                <Text style={s.drawerTitle}>Menu</Text>
                <Pressable
                  onPress={() => setMenuOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                  style={({ pressed }) => [s.closeBtn, pressed && s.navItemPressed]}
                  hitSlop={8}
                >
                  <X size={26} color={E.onPrimaryContainer} strokeWidth={2} />
                </Pressable>
              </View>

              <View style={s.navList}>
                {menuItems.map(({ label, icon: Icon, onPress, badge }) => (
                  <Pressable
                    key={label}
                    onPress={() => {
                      setMenuOpen(false);
                      onPress();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    style={({ pressed }) => [s.navItem, pressed && s.navItemPressed]}
                  >
                    <Icon size={24} color={E.onPrimaryContainer} strokeWidth={2} />
                    <Text style={s.navLabel}>{label}</Text>
                    {!!badge && badge > 0 && (
                      <View style={s.navBadge} accessibilityLabel={`${badge} rejected`}>
                        <Text style={s.navBadgeText}>{badgeText(badge)}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleLogout}
                accessibilityRole="button"
                accessibilityLabel="Log out"
                style={({ pressed }) => [s.logoutBtn, { paddingBottom: insets.bottom + Spacing.lg }, pressed && s.navItemPressed]}
              >
                <LogOut size={22} color="rgba(144,210,209,0.6)" strokeWidth={2} />
                <Text style={s.logoutText}>Log Out</Text>
              </Pressable>
            </Animated.View>
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
  hamburgerDot: {
    position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#E53935', borderWidth: 1.5, borderColor: D.surfaceContainerLowest,
  },
  bellWrapper: { alignItems: 'center' },
  bellTop: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.primary, marginBottom: 1 },
  bellBody: { width: 14, height: 13, borderWidth: 1.5, borderColor: D.primary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper: { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.primary },
  pressed: { opacity: 0.75 },

  // ── Side menu — mirrors ElderNavDrawer's styling ─────────────────────────
  backdrop: { backgroundColor: 'rgba(24,28,30,0.55)' },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: E.primaryContainer,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(144,210,209,0.25)',
  },
  drawerTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizeXL, color: E.onPrimary },
  closeBtn: { width: 40, height: 40, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },

  navList: { flex: 1, paddingHorizontal: Spacing.sm, paddingTop: Spacing.md, gap: 2 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    minHeight: 52,
  },
  navItemPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  navLabel: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: E.onPrimaryContainer },
  navBadge: {
    minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12,
    backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center',
  },
  navBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 12, color: '#ffffff' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(144,210,209,0.2)',
  },
  logoutText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: 'rgba(144,210,209,0.7)' },
});
