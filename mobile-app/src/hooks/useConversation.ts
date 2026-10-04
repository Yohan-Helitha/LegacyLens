import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { messagingApi } from '../services/api/messagingApi';
import type { ChatMessage, ConversationDetail } from '../types/messaging';

/** How often an open chat checks for new messages. There's no push channel yet, so this is a cheap "anything newer?" poll. */
const POLL_INTERVAL_MS = 5000;

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
  const mountedRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

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
      messagingApi.markRead(conversationId).catch(() => undefined);
    } catch {
      if (mountedRef.current) setLoadError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [conversationId]);

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
        messagingApi.markRead(conversationId).catch(() => undefined);
      }
    } catch {
      // A missed poll is harmless — the next one catches up.
    }
  }, [conversationId]);

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

  /** Sends a text message. Resolves false on failure so the caller can keep the draft. */
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
        if (mountedRef.current) setSendError(true);
        return false;
      } finally {
        if (mountedRef.current) setSending(false);
      }
    },
    [conversationId],
  );

  const clearSendError = useCallback(() => setSendError(false), []);

  return { detail, messages, loading, loadError, sending, sendError, send, clearSendError, reload: load };
}

export default useConversation;
