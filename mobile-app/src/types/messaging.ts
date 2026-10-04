/**
 * Shared in-app messaging between elders and content creators — mirrors
 * lk.ac.sliit.legacylens.messaging.dto.* (GET/POST /api/conversations/**).
 * Used by BOTH sides of the app; nothing here is creator- or elder-specific.
 */

export type MessageType = 'TEXT' | 'VOICE_NOTE';

/** Which side of a conversation someone is on. */
export type ConversationRole = 'ELDER' | 'CREATOR';

/** The inbox filter chips. */
export type ConversationFilter = 'ALL' | 'UNREAD' | 'COLLABORATIONS';

export interface ConversationParticipant {
  userId: string;
  name: string;
  /** "/uploads/..." path or full URL; null when they have no photo. */
  avatarUrl: string | null;
  role: ConversationRole;
  /** e.g. "Knowledge Holder" / "Content Creator". */
  roleLabel: string;
}

/** What the two are working on — the context card at the top of a chat. */
export interface ConversationContext {
  opportunityId: string;
  title: string;
  /** The opportunity's category, if any. */
  subtitle: string | null;
  /** yyyy-MM-dd — the booked date when there is a booking, else the opportunity's own. */
  date: string | null;
  timeWindowText: string | null;
  location: string | null;
  booked: boolean;
}

/** One inbox row. */
export interface ConversationSummary {
  id: string;
  otherParticipant: ConversationParticipant;
  context: ConversationContext | null;
  /** Null until the first message. */
  lastMessagePreview: string | null;
  lastMessageType: MessageType | null;
  lastMessageFromMe: boolean;
  /** Server local time, ISO without offset (e.g. "2026-10-04T10:40:12"). */
  lastMessageAt: string | null;
  unreadCount: number;
}

/** Header + context card for one chat. */
export interface ConversationDetail {
  id: string;
  myRole: ConversationRole;
  otherParticipant: ConversationParticipant;
  context: ConversationContext | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  fromMe: boolean;
  type: MessageType;
  /** Text for TEXT messages. */
  body: string | null;
  /** "/uploads/..." path for VOICE_NOTE messages. */
  mediaUrl: string | null;
  createdAt: string;
}
