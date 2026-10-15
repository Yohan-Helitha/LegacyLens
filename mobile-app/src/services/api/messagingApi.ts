import { apiGet, apiPost, apiPostForm } from './client';
import type {
  ChatMessage,
  ConversationDetail,
  ConversationFilter,
  ConversationSummary,
} from '../../types/messaging';

const query = (params: Record<string, string | number | undefined | null>) => {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

/**
 * Typed wrappers around the shared /api/conversations/** endpoints — the same
 * calls work for elders and creators (the backend works out each caller's side).
 * Voice notes are sent with the hiring module's
 * POST /api/conversations/{id}/reply-voice, which stores them here too.
 */
export const messagingApi = {
  list: (filter: ConversationFilter = 'ALL', search?: string) =>
    apiGet<ConversationSummary[]>(`/conversations${query({ filter, search: search?.trim() })}`),

  get: (conversationId: string) => apiGet<ConversationDetail>(`/conversations/${conversationId}`),

  /** Latest page by default; `after` for only newer messages (polling); `before` for older history. */
  getMessages: (conversationId: string, options: { before?: string; after?: string; limit?: number } = {}) =>
    apiGet<ChatMessage[]>(`/conversations/${conversationId}/messages${query(options)}`),

  send: (conversationId: string, text: string) =>
    apiPost<ChatMessage, { text: string }>(`/conversations/${conversationId}/messages`, { text }),

  /**
   * Sends a recorded clip as a voice message - the same endpoint the knowledge holder's side uses
   * (hiring's ReplyController), which stores the clip and adds it to this conversation.
   */
  sendVoice: (conversationId: string, clip: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('media', clip as unknown as Blob);
    return apiPostForm<void>(`/conversations/${conversationId}/reply-voice`, form);
  },

  /** How many messages from other people are unread across every chat - the number on the Inbox tab. */
  unreadCount: async () => (await apiGet<{ count: number }>('/conversations/unread-count')).count,

  markRead: (conversationId: string) =>
    apiPost<void, Record<string, never>>(`/conversations/${conversationId}/read`, {}),

  /**
   * Start (or reopen) the chat about an opportunity. A creator passes only the
   * opportunity; an elder also passes which creator (`participantId`).
   */
  open: (opportunityId: string, participantId?: string) =>
    apiPost<ConversationDetail, { opportunityId: string; participantId?: string }>(
      '/conversations',
      participantId ? { opportunityId, participantId } : { opportunityId },
    ),
};
