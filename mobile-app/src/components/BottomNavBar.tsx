import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Typography, Spacing, Radii } from '../theme';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — shared across all creator screens
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#fbf9f4',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant:         '#e4e2dd',
  primary:                '#9f3032',
  secondary:              '#336574',
  onSurfaceVariant:       '#574140',
  onSurface:              '#1b1c19',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type NavTab = 'home' | 'market' | 'inbox' | 'profile';

interface BottomNavBarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  /** Avatar URL for the profile tab icon */
  profileAvatarUri?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom primitive icons — drawn with View/borders to match the design language
// ─────────────────────────────────────────────────────────────────────────────

/** House icon */
const HomeIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={[iconS.homeWrap]}>
    {/* Roof triangle via border trick */}
    <View style={[iconS.homeRoof, { borderBottomColor: color }]} />
    {/* Door/walls */}
    <View style={[iconS.homeBody, { borderColor: color }]}>
      <View style={[iconS.homeDoor, { borderColor: color }]} />
    </View>
  </View>
);

/** Compass / market icon — two concentric circles with a centre dot */
const MarketIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={iconS.marketWrap}>
    <View style={[iconS.marketRing, { borderColor: color }]}>
      <View style={[iconS.marketInner, { borderColor: color }]}>
        <View style={[iconS.marketDot, { backgroundColor: color }]} />
      </View>
    </View>
  </View>
);

/** Speech-bubble inbox icon */
const InboxIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={iconS.inboxWrap}>
    <View style={[iconS.inboxBubble, { borderColor: color }]}>
      <View style={[iconS.inboxTail, { borderTopColor: color }]} />
    </View>
  </View>
);

/** Profile icon — avatar image or fallback silhouette */
const ProfileIcon: React.FC<{ color: string; avatarUri?: string }> = ({ color, avatarUri }) => {
  if (avatarUri) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={[iconS.profileAvatar, { borderColor: color }]}
        accessibilityLabel="Your profile"
      />
    );
  }
  // Fallback: head + body silhouette
  return (
    <View style={iconS.profileWrap}>
      <View style={[iconS.profileHead, { borderColor: color }]} />
      <View style={[iconS.profileBody, { borderColor: color }]} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BottomNavBar
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { key: NavTab; label: string }[] = [
  { key: 'home',    label: 'Home'    },
  { key: 'market',  label: 'Market'  },
  { key: 'inbox',   label: 'Inbox'   },
  { key: 'profile', label: 'Profile' },
];

const PROFILE_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdmWxeiutm8VuCuwb8B-bcbY4uwLEOEIZpHad16sSCOnOCn176-8moOj3W6uDPAciix85yHVNmpAd1RTzDZNIib4AVMq68gwoQfyYec-CiNygpv3Rti52MfEWixskGSi9K2HzQJc1XhIg649C9xWHdmBqgXNA5LsR-CP4PfF7fUKsBLElU0twICuF7-ZcI9Vlnj9GgnzoL4Bqj9ilpxA4BZs3oFt_0h7PcPdk4HDm4JKWKr6S3bofO2g';

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onNavigate,
  profileAvatarUri = PROFILE_AVATAR,
}) => {
  return (
    <View style={s.navBar}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const iconColor = isActive ? D.primary : D.onSurfaceVariant;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onNavigate(tab.key)}
            style={({ pressed }) => [s.navItem, pressed && s.pressed]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            {/* Icon */}
            <View style={s.iconWrap}>
              {tab.key === 'home'    && <HomeIcon    color={iconColor} />}
              {tab.key === 'market'  && <MarketIcon  color={iconColor} />}
              {tab.key === 'inbox'   && <InboxIcon   color={iconColor} />}
              {tab.key === 'profile' && (
                <ProfileIcon color={iconColor} avatarUri={profileAvatarUri} />
              )}
            </View>

            {/* Label */}
            <Text style={[s.navLabel, isActive && s.navLabelActive]}>
              {tab.label}
            </Text>

            {/* Active dot indicator */}
            {isActive && <View style={s.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
};

export default BottomNavBar;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconWrap: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontFamily: Typography.fontBodyMed,
    fontSize: 10,
    color: D.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: D.primary,
    fontFamily: Typography.fontBodySemi,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: D.primary,
  },
  pressed: { opacity: 0.7 },
});

// ── Icon primitive styles ─────────────────────────────────────────────────────
const iconS = StyleSheet.create({
  // House
  homeWrap:  { alignItems: 'center', justifyContent: 'flex-end', height: 22 },
  homeRoof: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginBottom: -1,
  },
  homeBody: {
    width: 14, height: 10,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeDoor: {
    width: 5, height: 6,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderRadius: 1,
    marginBottom: -1,
  },
  // Market
  marketWrap:  { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  marketRing:  { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  marketInner: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  marketDot:   { width: 4, height: 4, borderRadius: 2 },
  // Inbox
  inboxWrap:   { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  inboxBubble: {
    width: 20, height: 16, borderRadius: 6, borderWidth: 1.5,
    position: 'relative',
  },
  inboxTail: {
    position: 'absolute', bottom: -5, left: 5,
    width: 0, height: 0,
    borderLeftWidth: 4, borderRightWidth: 0, borderTopWidth: 5,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  // Profile
  profileWrap:   { width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  profileHead:   { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, marginBottom: 2 },
  profileBody:   { width: 16, height: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1.5, borderBottomWidth: 0 },
  profileAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5 },
});
