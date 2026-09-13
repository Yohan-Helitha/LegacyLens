import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Typography, Spacing, Radii } from '../../../theme';
import { BottomNavBar } from '../../../components/BottomNavBar';
import type { NavTab } from '../../../components/BottomNavBar';
import { CONVERSATIONS } from './InApp';

const KAMALA_AVATAR = require('../../../../assets/images/avatars/elder-woman.png');

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — same palette as every other creator screen.
// ─────────────────────────────────────────────────────────────────────────────
const D = {
  surface:                '#EDEFEE',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer:       '#e8f2f2',
  surfaceVariant:         '#c8dcdc',
  outlineVariant:         '#a0c4c4',

  primary:              '#0F5C5C',
  secondary:            '#E8792E',
  secondaryContainer:   '#fff0e6',
  onSecondaryContainer: '#9e4a0d',

  onSurface:        '#202428',
  onSurfaceVariant: '#4a5568',
  outline:          '#718096',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Icons — same outline style/colour convention as OpportunityDetailPage.
// ─────────────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; color?: string };

const PinIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="9" />
    <Path d="M12 7v5l3.5 2" />
  </Svg>
);

const CalendarIcon: React.FC<IconProps> = ({ size = 13, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="16" y1="3" x2="16" y2="7" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </Svg>
);

const SendIcon: React.FC<IconProps> = ({ size = 18, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M3 20l18-8L3 4v6l12 2-12 2z" />
  </Svg>
);

const MicIcon: React.FC<IconProps> = ({ size = 18, color = '#E8792E' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="9" y="1" width="6" height="12" rx="3" />
    <Path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <Line x1="12" y1="19" x2="12" y2="23" />
    <Line x1="8" y1="23" x2="16" y2="23" />
  </Svg>
);

const CheckDoubleIcon: React.FC<IconProps> = ({ size = 13, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12l5 5L18 6" />
    <Path d="M8 12l5 5L24 6" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Static per-conversation content — no messaging backend yet (see InApp.tsx's
// note), so this is demo data keyed by the same conversation id used there.
// Message text is Sinhala, since these conversations are with elders whose
// first language is Sinhala; surrounding UI chrome stays English.
// ─────────────────────────────────────────────────────────────────────────────
type ChatMessage = { id: string; text: string; time: string; fromMe: boolean };

type ConversationDetail = {
  contactRole: string;
  opportunityTitle: string;
  opportunitySubtitle: string;
  date: string;
  time: string;
  location: string;
  messages: ChatMessage[];
};

const CONVERSATION_DETAILS: Record<string, ConversationDetail> = {
  '1': {
    contactRole: 'Heritage Contributor',
    opportunityTitle: 'Traditional recipe documentation.',
    opportunitySubtitle: 'Recording details.',
    date: '25 Aug',
    time: '10.00 AM - 1.00 PM',
    location: 'Negombo',
    messages: [
      { id: 'm1', text: 'ඔයාට පුළුවන්ද ලබන සතියේ මගේ රෙසිපිය පටිගත කරන්න එන්න?', time: '09:41 AM', fromMe: false },
      { id: 'm2', text: 'ඔව්. සෙනසුරාදා උදේ කාලයක් මම එනවා.', time: '09:45 AM', fromMe: true },
      { id: 'm3', text: 'හොඳයි, මම ඔක්කොම සූදානම් කරගෙන ඉන්නම්.', time: 'Just now', fromMe: false },
    ],
  },
  '2': {
    contactRole: 'Knowledge Holder',
    opportunityTitle: 'Fishing Terms Documentation.',
    opportunitySubtitle: 'Recording local fishing vocabulary.',
    date: '28 Aug',
    time: '3.00 PM - 6.00 PM',
    location: 'Negombo',
    messages: [
      { id: 'm1', text: 'හෙට උදේ මාළු අල්ලන වෙලාවට ඔයාට කැමරාවෙන් එන්න පුළුවන්ද?', time: '11:10 AM', fromMe: false },
      { id: 'm2', text: 'ඔව් මාමා. උදේ පහට එනවා.', time: '11:15 AM', fromMe: true },
      { id: 'm3', text: 'හොඳයි පුතේ, ඒ වචන ටිකත් ලියලා තියෙනවා.', time: 'Just now', fromMe: false },
    ],
  },
};

const DEFAULT_DETAIL: ConversationDetail = CONVERSATION_DETAILS['1'];

// ─────────────────────────────────────────────────────────────────────────────
// TopAppBar
// ─────────────────────────────────────────────────────────────────────────────
const TopAppBar: React.FC = () => (
  <View style={s.appBar}>
    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Open menu">
      <View style={s.hamburger}>
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
        <View style={s.hamburgerLine} />
      </View>
    </Pressable>

    <Text style={s.appBarTitle}>Legacy Lens</Text>

    <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Notifications">
      <View style={s.bellWrapper}>
        <View style={s.bellTop} />
        <View style={s.bellBody} />
        <View style={s.bellClapper} />
      </View>
    </Pressable>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export const InboxMessage: React.FC<{
  onNavigate: (tab: NavTab) => void;
  onBack: () => void;
  conversationId: string | null;
}> = ({ onNavigate, onBack, conversationId }) => {
  const contact = CONVERSATIONS.find((c) => c.id === conversationId) ?? CONVERSATIONS[0];
  const detail = (conversationId && CONVERSATION_DETAILS[conversationId]) || DEFAULT_DETAIL;

  const [messages, setMessages] = useState<ChatMessage[]>(detail.messages);
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, text, time: 'Just now', fromMe: true }]);
    setDraft('');
  };

  return (
    <SafeAreaView style={s.safeArea} edges={['top'] as const}>
      <StatusBar style="dark" />

      <TopAppBar />

      {/* Conversation header */}
      <View style={s.convHeader}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={s.backArrow}>{'←'}</Text>
        </Pressable>

        <Image source={contact?.avatar ?? KAMALA_AVATAR} style={s.convAvatar} accessibilityLabel={`${contact?.name} profile photo`} />

        <View style={{ flex: 1 }}>
          <Text style={s.convName} numberOfLines={1}>{contact?.name ?? 'Conversation'}</Text>
          <Text style={s.convRole} numberOfLines={1}>{detail.contactRole}</Text>
        </View>

        <Pressable style={({ pressed }) => [s.iconBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="More options">
          <Text style={s.moreDots}>{'⋮'}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Opportunity context card */}
        <View style={s.contextCard}>
          <View style={s.verifiedBadge}>
            <Text style={s.verifiedBadgeText}>VERIFIED HERITAGE</Text>
          </View>
          <Text style={s.contextTitle}>{detail.opportunityTitle}</Text>
          <Text style={s.contextSubtitle}>{detail.opportunitySubtitle}</Text>

          <View style={s.contextChipsRow}>
            <View style={s.contextChip}>
              <View style={s.contextChipIconBox}><CalendarIcon /></View>
              <Text style={s.contextChipText}>{detail.date}</Text>
            </View>
            <View style={s.contextChip}>
              <View style={s.contextChipIconBox}><ClockIcon /></View>
              <Text style={s.contextChipText}>{detail.time}</Text>
            </View>
            <View style={s.contextChip}>
              <View style={s.contextChipIconBox}><PinIcon /></View>
              <Text style={s.contextChipText}>{detail.location}</Text>
            </View>
          </View>
        </View>

        {/* Date divider */}
        <View style={s.dateDividerRow}>
          <Text style={s.dateDividerText}>Today</Text>
        </View>

        {/* Messages */}
        <View style={{ gap: Spacing.sm }}>
          {messages.map((msg) =>
            msg.fromMe ? (
              <View key={msg.id} style={s.outgoingRow}>
                <View style={s.outgoingBubble}>
                  <Text style={s.outgoingText}>{msg.text}</Text>
                  <View style={s.bubbleMetaRow}>
                    <Text style={s.outgoingTime}>{msg.time}</Text>
                    <CheckDoubleIcon />
                  </View>
                </View>
              </View>
            ) : (
              <View key={msg.id} style={s.incomingRow}>
                <Image source={contact?.avatar ?? KAMALA_AVATAR} style={s.bubbleAvatar} accessibilityLabel={`${contact?.name} profile photo`} />
                <View style={s.incomingBubble}>
                  <Text style={s.incomingText}>{msg.text}</Text>
                  <Text style={s.incomingTime}>{msg.time}</Text>
                </View>
              </View>
            ),
          )}
        </View>
      </ScrollView>

      {/* Input row */}
      <View style={s.inputRow}>
        <Pressable style={({ pressed }) => [s.plusBtn, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Attach">
          <Text style={s.plusText}>{'+'}</Text>
        </Pressable>

        <View style={s.inputPill}>
          <TextInput
            style={s.textInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message....."
            placeholderTextColor={D.outline}
            multiline
            accessibilityLabel="Message input"
          />
          <View style={s.micBtn}>
            <MicIcon />
          </View>
        </View>

        <Pressable
          onPress={handleSend}
          style={({ pressed }) => [s.sendBtn, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <SendIcon />
        </Pressable>
      </View>

      <BottomNavBar activeTab="inbox" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

export default InboxMessage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },

  // ── App Bar ────────────────────────────────────────────────────────────────
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
  iconBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sizeLG,
    lineHeight: Typography.sizeLG * 1.4,
    color: D.primary,
    letterSpacing: -0.3,
  },
  hamburger:     { gap: 4 },
  hamburgerLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: D.secondary },
  bellWrapper:   { alignItems: 'center' },
  bellTop:       { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.secondary, marginBottom: 1 },
  bellBody:      { width: 14, height: 13, borderWidth: 1.5, borderColor: D.secondary, borderRadius: 7, borderBottomWidth: 0 },
  bellClapper:   { width: 5, height: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: D.secondary },

  // ── Conversation header ────────────────────────────────────────────────────
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: D.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.surfaceVariant,
  },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  convAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, borderColor: D.outlineVariant,
  },
  convName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  convRole: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, marginTop: 1 },
  moreDots: { fontSize: 20, color: D.onSurfaceVariant, lineHeight: 22 },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },

  // ── Opportunity context card ───────────────────────────────────────────────
  contextCard: {
    backgroundColor: D.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
    overflow: 'hidden',
  },
  verifiedBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: D.secondaryContainer,
    borderBottomLeftRadius: Radii.lg,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  verifiedBadgeText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 9,
    color: D.onSecondaryContainer,
    letterSpacing: 0.5,
  },
  contextTitle: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    color: D.onSurface,
    paddingRight: 90,
    marginBottom: 2,
  },
  contextSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  contextChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  contextChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: D.surfaceContainer,
    borderRadius: Radii.lg,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  contextChipIconBox: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(232, 121, 46, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  contextChipText: { fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.onSurfaceVariant },

  // ── Date divider ───────────────────────────────────────────────────────────
  dateDividerRow: { alignItems: 'center' },
  dateDividerText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 10,
    color: D.onSurfaceVariant,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    backgroundColor: D.surfaceVariant,
    borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 4,
    overflow: 'hidden',
  },

  // ── Chat bubbles ───────────────────────────────────────────────────────────
  incomingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, maxWidth: '85%', alignSelf: 'flex-start' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, flexShrink: 0 },
  incomingBubble: {
    backgroundColor: D.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.xl,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  incomingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurface },
  incomingTime: { fontFamily: Typography.fontBody, fontSize: 10, color: D.onSurfaceVariant, marginTop: 4, textAlign: 'right' },

  outgoingRow: { alignItems: 'flex-end', maxWidth: '85%', alignSelf: 'flex-end' },
  outgoingBubble: {
    backgroundColor: D.primary,
    borderRadius: Radii.xl,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  outgoingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: '#ffffff' },
  bubbleMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  outgoingTime: { fontFamily: Typography.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.8)' },

  // ── Input row ──────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: D.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.surfaceVariant,
  },
  plusBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(232, 121, 46, 0.12)',
  },
  plusText: { fontSize: 22, color: D.secondary, lineHeight: 24 },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: D.surfaceContainer,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
    paddingVertical: 10,
    maxHeight: 100,
  },
  micBtn: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: D.secondary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: D.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Press feedback ─────────────────────────────────────────────────────────
  pressed: { opacity: 0.75 },
});
