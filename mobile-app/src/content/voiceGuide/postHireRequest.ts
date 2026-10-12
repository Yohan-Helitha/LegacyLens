import type { VoiceGuidePage } from "./types";

/** PostHireRequestScreen.tsx — "Request Help from a Content Creator". */
export const postHireRequestGuide: VoiceGuidePage = {
  pageKey: "hirePost",
  title: "Request Help from a Content Creator",
  introNarration:
    "This screen is for asking a content creator to help you capture a story — for example, if you'd like someone to visit and film it with you.",
  steps: [
    {
      id: "menuButton",
      targetKey: "menuButton",
      narration: "This button opens your menu.",
      highlightShape: "circle",
    },
    {
      id: "guidanceList",
      targetKey: "guidanceList",
      narration: "This list gives you ideas of what's helpful to mention in your request.",
      highlightShape: "rectangle",
    },
    {
      id: "titleField",
      targetKey: "titleField",
      narration: "Give your request a short title here, by typing or speaking.",
      highlightShape: "rectangle",
    },
    {
      id: "detailsField",
      targetKey: "detailsField",
      narration: "Describe what you'd like help with here — as much detail as you can.",
      highlightShape: "rectangle",
    },
    {
      id: "submitButton",
      targetKey: "submitButton",
      narration: "When you're ready, tap this to send your request for review.",
      highlightShape: "rectangle",
    },
  ],
};

export default postHireRequestGuide;
