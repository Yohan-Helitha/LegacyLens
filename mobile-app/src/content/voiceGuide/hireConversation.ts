import type { VoiceGuidePage } from "./types";

/** HireConversationScreen.tsx — message thread with a chosen creator. */
export const hireConversationGuide: VoiceGuidePage = {
  pageKey: "hireConversation",
  title: "Messages",
  introNarration: "This screen is your conversation with the content creator you chose.",
  steps: [
    {
      id: "backButton",
      targetKey: "backButton",
      narration: "This takes you back to My Requests.",
      highlightShape: "circle",
    },
    {
      id: "messageThread",
      targetKey: "messageThread",
      narration: "Your conversation appears here, with your messages on the right.",
      highlightShape: "rectangle",
    },
    {
      id: "replyField",
      targetKey: "replyField",
      narration: "Type your message here, or tap the microphone inside it to speak instead.",
      highlightShape: "rectangle",
    },
    {
      id: "sendButton",
      targetKey: "sendButton",
      narration: "Tap this to send your message.",
      highlightShape: "circle",
    },
  ],
};

export default hireConversationGuide;
