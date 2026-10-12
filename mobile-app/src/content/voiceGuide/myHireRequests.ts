import type { VoiceGuidePage } from "./types";

/** MyHireRequestsScreen.tsx — "My Requests". */
export const myHireRequestsGuide: VoiceGuidePage = {
  pageKey: "hireRequests",
  title: "My Requests",
  introNarration: "This screen lists every request you've sent asking a content creator for help.",
  steps: [
    {
      id: "menuButton",
      targetKey: "menuButton",
      narration: "This button opens your menu.",
      highlightShape: "circle",
    },
    {
      id: "requestCard",
      targetKey: "requestCard",
      narration:
        "Each request you've sent appears here, along with what's happening with it. Tap it to see who has replied, or to message the person you chose.",
      highlightShape: "rectangle",
      isListItem: true,
    },
    {
      id: "newRequestButton",
      targetKey: "newRequestButton",
      narration: "Tap this any time to send a new request.",
      highlightShape: "rectangle",
    },
  ],
};

export default myHireRequestsGuide;
