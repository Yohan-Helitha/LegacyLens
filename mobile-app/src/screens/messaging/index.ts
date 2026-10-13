/**
 * Shared in-app messaging — used by BOTH the creator and the elder side.
 * Each side renders these with its own app bar / bottom navigation:
 *
 *   // Creator (CreatorNavigator)
 *   <InApp insetTop header={<CreatorTopAppBar variant="menu" … />}
 *          footer={<BottomNavBar activeTab="inbox" … />}
 *          onOpenConversation={(id) => …} />
 *
 *   // Elder (e.g. ContentCaptureNavigator)
 *   <InApp header={<Header title="Messages" … />}
 *          footer={<UserFooter activeTab="home" … />}
 *          onOpenConversation={(id) => …} />
 *   <InboxMessage conversationId={id} onBack={…} header={<Header … />} />
 *
 * To start a chat from a screen (e.g. "Message the elder" on a booked job),
 * call messagingApi.open(opportunityId[, creatorId]) and open the returned id.
 */
export { InApp } from './InApp';
export type { InAppProps } from './InApp';
export { InboxMessage } from './InboxMessage';
export type { InboxMessageProps } from './InboxMessage';
