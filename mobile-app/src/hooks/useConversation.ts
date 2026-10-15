import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { messagingApi } from '../services/api/messagingApi';
import { useInboxUnreadStore } from '../store/inboxUnreadStore';
import { usePushNotificationEvents } from './usePushNotifications';
import type { ChatMessage, ConversationDetail } from '../types/messaging';

/**
 * How often an open chat checks for new messages when nothing tells it sooner: a cheap "anything newer?" poll.
 * A notification arriving while the chat is open makes it check straight away.
 */
const POLL_INTERVAL_MS = 5000;

/** A message that could not be sent. It stays in the chat, marked, so it can be sent again or removed. */
export interface FailedMessage {
  key: string;
  text: string;
  /** True while a resend is in flight. */
  retrying: boolean;
}

/** Adds messages that aren't already there (by id) and keeps reading order. */
const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map((message) => message.id));
  const added = incoming.filter((message) => !seen.has(message.id));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

/**
 * One open chat (shared InboxMessage screen) for either side of the app:
 * loads the header/context and the latest messages, polls for new ones while
 * the app is in the foreground, marks the chat read, and sends text.
 */
export function useConversation(conversationId: string) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [failed, setFailed] = useState<FailedMessage[]>([]);
  const mountedRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  /** The chat is read: tell the backend, then refresh the Inbox tab's number so it drops at once. */
  const markRead = useCallback(() => {
    messagingApi
      .markRead(conversationId)
      .then(() => useInboxUnreadStore.getState().refresh(true))
      .catch(() => undefined);
  }, [conversationId]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [conversation, latest] = await Promise.all([
        messagingApi.get(conversationId),
        messagingApi.getMessages(conversationId),
      ]);
      if (!mountedRef.current) return;
      setDetail(conversation);
      setMessages(latest ?? []);
      markRead();
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [conversationId, markRead]);

  /** Fetches only what arrived since the newest message we have; marks the chat read if any of it is theirs. */
  const poll = useCallback(async () => {
    const newest = messagesRef.current[messagesRef.current.length - 1];
    try {
      const incoming = newest
        ? await messagingApi.getMessages(conversationId, { after: newest.createdAt })
        : await messagingApi.getMessages(conversationId);
      if (!mountedRef.current || !incoming?.length) return;
      setMessages((prev) => mergeMessages(prev, incoming));
      if (incoming.some((message) => !message.fromMe)) {
        markRead();
      }
    } catch {
      // A missed poll is harmless — the next one catches up.
    }
  }, [conversationId, markRead]);

  // A notification arriving while this chat is open is almost always a new message: look for it right away
  // instead of waiting for the next check.
  usePushNotificationEvents({ onReceived: poll });

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  // Poll only while the chat is loaded and the app is in the foreground.
  useEffect(() => {
    if (!detail) return undefined;
    let timer: ReturnType<typeof setInterval> | null = setInterval(poll, POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        poll();
        if (!timer) timer = setInterval(poll, POLL_INTERVAL_MS);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    return () => {
      if (timer) clearInterval(timer);
      subscription.remove();
    };
  }, [detail, poll]);

  /**
   * Sends a text message. When it cannot be sent it is kept in the chat as a "not sent" message (see
   * `failed`) that can be tried again - so what the person wrote is never lost. Resolves false on failure.
   */
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      setSending(true);
      setSendError(false);
      try {
        const sent = await messagingApi.send(conversationId, trimmed);
        if (mountedRef.current && sent) setMessages((prev) => mergeMessages(prev, [sent]));
        return true;
      } catch {
        if (mountedRef.current) {
          setFailed((prev) => [...prev, { key: `failed-${Date.now()}-${prev.length}`, text: trimmed, retrying: false }]);
        }
        return false;
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    [conversationId],
  );

  /** Tries a "not sent" message again; on success it becomes a normal message, on failure it stays marked. */
  const retryFailed = useCallback(
    async (key: string) => {
      const target = failed.find((item) => item.key === key);
      if (!target || target.retrying) return;
      setFailed((prev) => prev.map((item) => (item.key === key ? { ...item, retrying: true } : item)));
      try {
        const sent = await messagingApi.send(conversationId, target.text);
        if (!mountedRef.current) return;
        if (sent) setMessages((prev) => mergeMessages(prev, [sent]));
        setFailed((prev) => prev.filter((item) => item.key !== key));
      } catch {
        if (mountedRef.current) {
          setFailed((prev) => prev.map((item) => (item.key === key ? { ...item, retrying: false } : item)));
        }
      }
    },
    [conversationId, failed],
  );

  /** Removes a "not sent" message the person decided not to send after all. */
  const discardFailed = useCallback((key: string) => {
    setFailed((prev) => prev.filter((item) => item.key !== key));
  }, []);

  /** Sends a recorded clip as a voice message, then fetches it so it shows in the chat. Resolves false on failure. */
  const sendVoice = useCallback(
    async (clip: { uri: string; durationMillis: number }): Promise<boolean> => {
      setSending(true);
      setSendError(false);
      try {
        await messagingApi.sendVoice(conversationId, { uri: clip.uri, name: `voice-${Date.now()}.m4a`, type: 'audio/mp4' });
        await poll();
        return true;
      } catch {
        if (mountedRef.current) setSendError(true);
        return false;
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    [conversationId, poll],
  );

  const clearSendError = useCallback(() => setSendError(false), []);

  return {
    detail, messages, loading, loadError, sending, sendError, failed,
    send, retryFailed, discardFailed, sendVoice, clearSendError, reload: load,
  };
}

export default useConversation;
