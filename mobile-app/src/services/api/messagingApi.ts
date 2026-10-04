import { apiGet, apiPost } from './client';
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
