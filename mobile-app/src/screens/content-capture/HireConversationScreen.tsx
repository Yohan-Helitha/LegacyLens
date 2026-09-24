import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Send } from 'lucide-react-native';
import { Avatar, Header, RoundIconButton } from '../../components/common';
import { MicInputField, ContentCaptureColors as D } from '../../components/module-specific/content-capture';
import { useHireStrings } from '../../hooks/useHireStrings';
import { Typography, Spacing, Radii } from '../../theme';

interface ChatMessage {
  id: string;
  text: string;
}

interface HireConversationScreenProps {
  creatorName: string;
  /** The hire request this conversation is about. */
  jobTitle: string;
  onBack?: () => void;
}

/**
 * Conversation with the creator the elder chose ("Message" on My Requests).
 * The reply bar is one line with the mango-orange mic inside it, so a reply
 * can be dictated instead of typed.
 *
 * Messaging isn't built on the backend yet: MessagingChannelPortImpl is a
 * logging stub, and only a voice-note endpoint (POST
 * /api/conversations/{id}/reply-voice) exists — there is no way to list or
 * send text messages, and approving an applicant doesn't return the
 * conversation id. Until the Marketplace messaging API lands, replies are
 * held in local state for this session only, the same demo-data approach the
 * creator-side InboxMessage screen takes.
 */
export const HireConversationScreen: React.FC<HireConversationScreenProps> = ({
  creatorName,
  jobTitle,
  onBack,
}) => {
  const { t, speechLang, voiceLabels } = useHireStrings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const displayName = creatorName || t('requests.creatorFallback');
  const canSend = draft.trim().length > 0;

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, text }]);
    setDraft('');
  };

  return (
    <View style={s.screen}>
      <StatusBar style="light" />

      <Header
        title={t('chat.headerTitle')}
        showBack
        onBackPress={onBack}
        backLabel={t('common.back')}
        notificationLabel={t('common.notifications')}
      />

      <View style={s.contextBar}>
        <Avatar size={44} />
        <View style={s.contextText}>
          <Text style={s.creatorName} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={s.jobTitle} numberOfLines={2}>
            {t('chat.about', { title: jobTitle })}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={s.flex} behavior="padding">
        <ScrollView
          ref={scrollRef}
          style={s.flex}
          contentContainerStyle={s.thread}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={s.intro}>
            <Text style={s.introText}>{t('chat.intro', { name: displayName })}</Text>
          </View>

          {messages.map((message) => (
            <View
              key={message.id}
              style={s.bubble}
              accessible
              accessibilityLabel={`${t('chat.you')}. ${message.text}`}
            >
              <Text style={s.bubbleText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={s.replyBar}>
          <View style={s.replyField}>
            <MicInputField
              label={t('chat.replyLabel')}
              hideLabel
              value={draft}
              onChangeText={setDraft}
              placeholder={t('chat.replyPlaceholder')}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              voiceLang={speechLang}
              voiceLabels={voiceLabels(t('chat.replyLabel'))}
            />
          </View>

          <RoundIconButton
            icon={Send}
            size={48}
            iconSize={20}
            color={canSend ? D.secondaryContainer : D.onSurfaceVariant}
            backgroundColor={canSend ? D.primary : D.surfaceVariant}
            onPress={canSend ? handleSend : undefined}
            accessibilityLabel={t('chat.send')}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.surface },
  flex: { flex: 1 },

  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.outlineVariant,
  },
  contextText: { flex: 1, gap: 2 },
  creatorName: {
    fontFamily: Typography.fontBodySemi,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onSurface,
  },
  jobTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 20,
    color: D.onSurfaceVariant,
  },

  thread: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  intro: {
    alignSelf: 'center',
    maxWidth: '92%',
    backgroundColor: D.surfaceContainer,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  introText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeSM,
    lineHeight: 22,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    backgroundColor: D.primary,
    borderRadius: Radii.xl,
    borderBottomRightRadius: Radii.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  bubbleText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizeMD,
    lineHeight: 24,
    color: D.onPrimary,
  },

  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: D.surfaceContainerLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: D.outlineVariant,
  },
  replyField: { flex: 1 },
});

export default HireConversationScreen;
