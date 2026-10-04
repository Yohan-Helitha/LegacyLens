import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { Avatar } from '../../components/common';
import { useConversation } from '../../hooks/useConversation';
import { useVoiceToText } from '../../hooks/useVoiceToText';
import { LOCALE_SPEECH_TAG } from '../../constants/hireStrings';
import { useLocaleStore } from '../../store/localeStore';
import type { ChatMessage } from '../../types/messaging';
import { dayKey, formatClockTime, formatDayLabel, formatShortDate } from '../../utils/messageTime';
import { Typography, Spacing, Radii } from '../../theme';
import { messagingAvatarUri, MessagingColors as D } from './messagingTheme';
import { VoiceNoteBubble } from './VoiceNoteBubble';

// ─────────────────────────────────────────────────────────────────────────────
// Icons — same outline style as OpportunityDetailPage.
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

// ─────────────────────────────────────────────────────────────────────────────
// Props — shared by elders and creators; each side brings its own chrome.
// ─────────────────────────────────────────────────────────────────────────────
export interface InboxMessageProps {
  conversationId: string;
  onBack: () => void;
  /** The side's own app bar (creator: CreatorTopAppBar, elder: Header). */
  header?: React.ReactNode;
  /** The side's own bottom navigation, if it shows one inside a chat. */
  footer?: React.ReactNode;
  /** True when `header` doesn't pad for the status bar itself (CreatorTopAppBar). The elder Header already does. */
  insetTop?: boolean;
}

/** One message bubble, mine on the right in teal, theirs on the left in white. */
const MessageBubble: React.FC<{ message: ChatMessage; avatarUri: string | null }> = ({ message, avatarUri }) => {
  const content =
    message.type === 'VOICE_NOTE' && message.mediaUrl ? (
      <VoiceNoteBubble mediaUrl={message.mediaUrl} fromMe={message.fromMe} />
    ) : (
      <Text style={message.fromMe ? s.outgoingText : s.incomingText}>{message.body}</Text>
    );

  if (message.fromMe) {
    return (
      <View style={s.outgoingRow}>
        <View style={s.outgoingBubble}>
          {content}
          <Text style={s.outgoingTime}>{formatClockTime(message.createdAt)}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={s.incomingRow}>
      <Avatar uri={avatarUri} size={28} />
      <View style={s.incomingBubble}>
        {content}
        <Text style={s.incomingTime}>{formatClockTime(message.createdAt)}</Text>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
/**
 * One conversation — shared by elders and content creators. Shows what the two
 * are working on (context card), the messages with day dividers, and a reply
 * bar whose mic dictates into the text box in the user's own language.
 * New messages arrive by polling every few seconds (see useConversation).
 */
export const InboxMessage: React.FC<InboxMessageProps> = ({ conversationId, onBack, header, footer, insetTop = false }) => {
  const { detail, messages, loading, loadError, sending, sendError, send, clearSendError, reload } =
    useConversation(conversationId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const locale = useLocaleStore((state) => state.locale);
  const voice = useVoiceToText({
    lang: LOCALE_SPEECH_TAG[locale],
    onFinalResult: (text) => setDraft((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text)),
  });

  // Keep the newest message in view as messages arrive.
  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (voice.isListening) voice.stop();
    setDraft('');
    clearSendError();
    if (!(await send(text))) setDraft(text); // keep what they wrote if it didn't go through
  };

  const other = detail?.otherParticipant;
  const otherAvatar = messagingAvatarUri(other?.avatarUrl);
  const context = detail?.context;

  const contextChips: { key: string; icon: React.ReactNode; text: string }[] = [];
  if (context?.date) contextChips.push({ key: 'date', icon: <CalendarIcon />, text: formatShortDate(context.date) });
  if (context?.timeWindowText) contextChips.push({ key: 'time', icon: <ClockIcon />, text: context.timeWindowText });
  if (context?.location) contextChips.push({ key: 'place', icon: <PinIcon />, text: context.location });

  return (
    <SafeAreaView style={s.safeArea} edges={insetTop ? (['top'] as const) : []}>
      <StatusBar style="dark" />

      {header}

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

        <Avatar uri={otherAvatar} size={40} />

        <View style={{ flex: 1 }}>
          <Text style={s.convName} numberOfLines={1}>{other?.name ?? ' '}</Text>
          {!!other?.roleLabel && <Text style={s.convRole} numberOfLines={1}>{other.roleLabel}</Text>}
        </View>
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading && !detail ? (
          <View style={s.stateBox}>
            <ActivityIndicator size="large" color={D.primary} accessibilityLabel="Loading conversation" />
          </View>
        ) : loadError && !detail ? (
          <View style={s.stateBox}>
            <Text style={s.stateTitle}>Couldn't open this conversation</Text>
            <Pressable onPress={reload} style={({ pressed }) => [s.retryBtn, pressed && s.pressed]} accessibilityRole="button">
              <Text style={s.retryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={s.flex}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {context && (
              <View style={s.contextCard}>
                {context.booked && (
                  <View style={s.bookedBadge}>
                    <Text style={s.bookedBadgeText}>BOOKED</Text>
                  </View>
                )}
                <Text style={s.contextTitle}>{context.title}</Text>
                {!!context.subtitle && <Text style={s.contextSubtitle}>{context.subtitle}</Text>}

                {contextChips.length > 0 && (
                  <View style={s.contextChipsRow}>
                    {contextChips.map((chip) => (
                      <View key={chip.key} style={s.contextChip}>
                        <View style={s.contextChipIconBox}>{chip.icon}</View>
                        <Text style={s.contextChipText}>{chip.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {messages.length === 0 ? (
              <Text style={s.emptyChat}>No messages yet — say hello to {other?.name ?? 'them'}.</Text>
            ) : (
              <View style={{ gap: Spacing.sm }}>
                {messages.map((message, index) => {
                  const showDivider = index === 0 || dayKey(messages[index - 1].createdAt) !== dayKey(message.createdAt);
                  return (
                    <React.Fragment key={message.id}>
                      {showDivider && (
                        <View style={s.dateDividerRow}>
                          <Text style={s.dateDividerText}>{formatDayLabel(message.createdAt)}</Text>
                        </View>
                      )}
                      <MessageBubble message={message} avatarUri={otherAvatar} />
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {(sendError || !!voice.error) && (
          <Text style={s.errorLine} accessibilityRole="alert">
            {sendError ? "Your message didn't send. Please try again." : voice.error}
          </Text>
        )}

        {/* Input row */}
        <View style={s.inputRow}>
          <View style={[s.inputPill, voice.isListening && s.inputPillListening]}>
            <TextInput
              style={s.textInput}
              value={draft}
              onChangeText={setDraft}
              placeholder={voice.isListening ? 'Listening…' : 'Type a message....'}
              placeholderTextColor={D.outline}
              multiline
              maxLength={2000}
              accessibilityLabel="Message input"
              editable={!!detail}
            />
            <Pressable
              onPress={voice.toggle}
              disabled={!detail}
              style={({ pressed }) => [s.micBtn, voice.isListening && s.micBtnActive, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel={voice.isListening ? 'Stop voice typing' : 'Speak your message'}
              accessibilityState={{ selected: voice.isListening }}
            >
              <MicIcon color={voice.isListening ? '#ffffff' : D.secondary} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending || !detail}
            style={({ pressed }) => [s.sendBtn, (!draft.trim() || sending) && s.sendBtnDisabled, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {sending ? <ActivityIndicator size="small" color="#ffffff" /> : <SendIcon />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {footer}
    </SafeAreaView>
  );
};

export default InboxMessage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.surface },
  flex: { flex: 1 },

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
  iconBtn: { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: D.primary, lineHeight: 24 },
  convName: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface },
  convRole: { fontFamily: Typography.fontBody, fontSize: Typography.sizeXS, color: D.onSurfaceVariant, marginTop: 1 },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md },

  // ── Context card ───────────────────────────────────────────────────────────
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
  bookedBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: D.secondaryContainer,
    borderBottomLeftRadius: Radii.lg,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  bookedBadgeText: { fontFamily: Typography.fontBodySemi, fontSize: 10, color: D.onSecondaryContainer, letterSpacing: 0.5 },
  contextTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface, paddingRight: 70, marginBottom: 2 },
  contextSubtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, marginBottom: Spacing.sm },
  contextChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
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
  dateDividerRow: { alignItems: 'center', marginVertical: 4 },
  dateDividerText: {
    fontFamily: Typography.fontBodySemi,
    fontSize: 11,
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
  incomingBubble: {
    flexShrink: 1,
    backgroundColor: D.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    borderRadius: Radii.xl,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  incomingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: D.onSurface },
  incomingTime: { fontFamily: Typography.fontBody, fontSize: 11, color: D.onSurfaceVariant, marginTop: 4, textAlign: 'right' },

  outgoingRow: { alignItems: 'flex-end', maxWidth: '85%', alignSelf: 'flex-end' },
  outgoingBubble: {
    backgroundColor: D.primary,
    borderRadius: Radii.xl,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  outgoingText: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, lineHeight: 22, color: '#ffffff' },
  outgoingTime: { fontFamily: Typography.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'right' },

  emptyChat: { fontFamily: Typography.fontBody, fontSize: Typography.sizeSM, color: D.onSurfaceVariant, textAlign: 'center', marginTop: Spacing.lg },

  // ── States ─────────────────────────────────────────────────────────────────
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg },
  stateTitle: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeMD, color: D.onSurface, textAlign: 'center' },
  retryBtn: { backgroundColor: D.primary, borderRadius: Radii.lg, paddingHorizontal: Spacing.lg, minHeight: 44, justifyContent: 'center' },
  retryBtnText: { fontFamily: Typography.fontBodySemi, fontSize: Typography.sizeSM, color: '#ffffff' },
  errorLine: {
    fontFamily: Typography.fontBodyMed, fontSize: Typography.sizeXS, color: D.danger,
    textAlign: 'center', paddingHorizontal: Spacing.md, paddingTop: 6,
  },

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
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: D.surfaceContainer,
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.surfaceVariant,
    paddingLeft: Spacing.md,
    paddingRight: 4,
    maxHeight: 120,
  },
  inputPillListening: { borderColor: D.secondary, borderWidth: 1.5 },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    color: D.onSurface,
    paddingVertical: 10,
    maxHeight: 100,
  },
  micBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  micBtnActive: { backgroundColor: D.secondary },
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
  sendBtnDisabled: { opacity: 0.5 },

  pressed: { opacity: 0.75 },
});
