import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  BookOpen,
  Handshake,
  BadgeCheck,
  UserSearch,
  ClipboardList,
  Star,
  Mic,
  Settings,
  LogOut,
  X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Spacing, Radii } from '../../../theme';
import { ContentCaptureColors as D } from './tokens';
import { useAuthStore } from '../../../store/authStore';
import { messagingApi } from '../../../services/api/messagingApi';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ElderDrawerItem =
  | 'home'
  | 'stories'
  | 'requests'
  | 'trust'
  | 'reviews'
  | 'hire'
  | 'myRequests'
  | 'voiceHelp'
  | 'settings';

interface ElderNavDrawerProps {
  visible: boolean;
  onClose: () => void;
  /** Which item shows the active highlight — the dashboard is always "home" */
  activeItem?: ElderDrawerItem;
  userName?: string;
  userRole?: string;
  userLevel?: string;
  avatarUri?: string;
  /** Badge count shown on "Requests" (messages); defaults to the elder's own unread-message count. */
  requestsCount?: number;
  /** Fired for any item other than the currently active one, right before the drawer closes */
  onNavigate?: (item: ElderDrawerItem) => void;
  onLogout?: () => void;
}

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.85, 360);

const NAV_ITEMS: { key: ElderDrawerItem; labelKey: string; icon: LucideIcon }[] = [
  { key: 'home', labelKey: 'drawer.home', icon: Home },
  { key: 'stories', labelKey: 'drawer.stories', icon: BookOpen },
  { key: 'requests', labelKey: 'drawer.requests', icon: Handshake },
  { key: 'trust', labelKey: 'drawer.trust', icon: BadgeCheck },
  { key: 'reviews', labelKey: 'drawer.reviews', icon: Star },
  // Opens the creators recommended for each of the elder's open opportunities; posting a new request
  // lives under My Requests (or the floating "Ask for help" button).
  { key: 'hire', labelKey: 'drawer.hire', icon: UserSearch },
  { key: 'myRequests', labelKey: 'drawer.myRequests', icon: ClipboardList },
];

const HELP_ITEMS: { key: ElderDrawerItem; labelKey: string; icon: LucideIcon }[] = [
  { key: 'voiceHelp', labelKey: 'drawer.voiceHelp', icon: Mic },
  { key: 'settings', labelKey: 'drawer.settings', icon: Settings },
];

// ─────────────────────────────────────────────────────────────────────────────
// ElderNavDrawer — slide-in navigation drawer scoped to the elder dashboard.
// Deliberately NOT built into ContentCaptureTopBar: that top bar (and its
// "menu" button) is shared by every content-capture screen, but this drawer
// is dashboard-only. The dashboard supplies its own onLeftPress to open it.
// ─────────────────────────────────────────────────────────────────────────────
export const ElderNavDrawer: React.FC<ElderNavDrawerProps> = ({
  visible,
  onClose,
  activeItem = 'home',
  userName: userNameProp,
  userRole,
  userLevel,
  avatarUri,
  requestsCount: requestsCountProp,
  onNavigate,
  onLogout,
}) => {
  const { t } = useTranslation('contentCapture');
  const signedInName = useAuthStore((state) => state.user?.fullName);
  const userName = userNameProp ?? signedInName ?? '';
  const [unreadCount, setUnreadCount] = useState(0);
  const requestsCount = requestsCountProp ?? unreadCount;
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
        setMounted(false)
      );
    }
  }, [visible]);

  // Refresh the "Requests" badge each time the drawer opens (the number of unread chat messages).
  useEffect(() => {
    if (!visible || requestsCountProp !== undefined) return;
    let cancelled = false;
    messagingApi
      .list('UNREAD')
      .then((unread) => {
        if (!cancelled) setUnreadCount((unread ?? []).reduce((sum, item) => sum + item.unreadCount, 0));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [visible, requestsCountProp]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!mounted) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0] });

  const handleItemPress = (item: ElderDrawerItem) => {
    onClose();
    if (item !== activeItem) onNavigate?.(item);
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, s.backdrop, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('drawer.closeNavigation')}
          />
        </Animated.View>

        <Animated.View
          style={[
            s.drawer,
            { width: DRAWER_WIDTH, transform: [{ translateX }] },
          ]}
        >
          {/* Everything scrolls together, so nothing gets squeezed or overlaps when labels wrap (long Sinhala/Tamil
              text) or the screen is short; Log out is the last row and sits at the bottom when there is room. */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.md },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
          <View style={s.header}>
            <View style={s.avatarCircle}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatarImage} />
              ) : (
                <Text style={s.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
              )}
            </View>

            <Text style={s.userName}>{userName}</Text>
            <View style={s.userMetaRow}>
              <Text style={s.userMetaText}>{userRole ?? t('drawer.defaultRole')}</Text>
              <View style={s.metaDot} />
              <Text style={s.userMetaText}>{userLevel ?? t('drawer.defaultLevel')}</Text>
            </View>
          </View>

          <View style={s.navList}>
            {NAV_ITEMS.map(({ key, labelKey, icon: Icon }) => {
              const label = t(labelKey);
              const isActive = key === activeItem;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleItemPress(key)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    s.navItem,
                    isActive && s.navItemActive,
                    pressed && s.navItemPressed,
                  ]}
                >
                  <Icon
                    size={24}
                    color={isActive ? D.secondaryContainer : D.onPrimaryContainer}
                    strokeWidth={2}
                  />
                  <Text style={[s.navLabel, isActive && s.navLabelActive]}>{label}</Text>
                  {key === 'requests' && !!requestsCount && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{requestsCount}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <View style={s.divider} />

            {HELP_ITEMS.map(({ key, labelKey, icon: Icon }) => {
              const label = t(labelKey);
              return (
              <Pressable
                key={key}
                onPress={() => handleItemPress(key)}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={({ pressed }) => [s.navItem, pressed && s.navItemPressed]}
              >
                <Icon size={24} color={D.onPrimaryContainer} strokeWidth={2} />
                <Text style={s.navLabel}>{label}</Text>
              </Pressable>
              );
            })}
          </View>

          <View style={s.footer}>
            <Pressable
              onPress={onLogout}
              accessibilityRole="button"
              accessibilityLabel={t('drawer.logOut')}
              style={({ pressed }) => [s.navItem, pressed && s.navItemPressed]}
            >
              <LogOut size={24} color={D.onPrimaryContainer} strokeWidth={2} />
              <Text style={s.navLabel}>{t('drawer.logOut')}</Text>
            </Pressable>
          </View>
          </ScrollView>

          {/* Fixed so it stays reachable however far the list is scrolled. */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('drawer.closeNavigation')}
            style={[s.closeBtn, { top: insets.top + Spacing.sm }]}
            hitSlop={8}
          >
            <X size={26} color={D.onPrimaryContainer} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(24,28,30,0.55)' },

  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: D.primaryContainer,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },

  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(144,210,209,0.25)',
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.sm,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: D.primary,
    borderWidth: 2,
    borderColor: 'rgba(144,210,209,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontFamily: Typography.fontDisplay, fontSize: 28, color: D.onPrimary },
  userName: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeXL,
    color: D.onPrimary,
    marginBottom: 4,
  },
  userMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  userMetaText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onPrimaryContainer },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: D.onPrimaryContainer, opacity: 0.5 },

  navList: { flexGrow: 1, paddingHorizontal: Spacing.sm, paddingTop: Spacing.md, gap: 2 },
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
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderLeftColor: D.secondaryContainer,
  },
  navItemPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  navLabel: { flex: 1, fontFamily: Typography.fontBody, fontSize: Typography.sizeMD, color: D.onPrimaryContainer },
  navLabelActive: { fontFamily: Typography.fontBodySemi, color: D.onPrimary },

  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(254,137,62,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeXS, color: D.secondaryContainer },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(144,210,209,0.15)',
    marginVertical: Spacing.md,
    marginHorizontal: Spacing.sm,
  },

  // Log out is a normal row (same size and look as the others) below a divider, so it can never collide with Settings.
  footer: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(144,210,209,0.2)',
  },
});

export default ElderNavDrawer;
