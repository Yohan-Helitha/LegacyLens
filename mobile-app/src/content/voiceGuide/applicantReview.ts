import type { VoiceGuidePage } from "./types";

/** ApplicantReviewScreen.tsx — "Replies for Your Request". */
export const applicantReviewGuide: VoiceGuidePage = {
  pageKey: "hireApplicants",
  title: "Replies for Your Request",
  introNarration: "This screen shows everyone who has offered to help with your request.",
  steps: [
    {
      id: "backButton",
      targetKey: "backButton",
      narration: "This takes you back to My Requests.",
      highlightShape: "circle",
    },
    {
      id: "applicantCard",
      targetKey: "applicantCard",
      narration: "Each person who has offered to help appears here, with their message to you.",
      highlightShape: "rectangle",
      isListItem: true,
    },
    {
      id: "replyWithVoiceButton",
      targetKey: "replyWithVoiceButton",
      narration: "Tap this to send them a short voice reply before you decide.",
      highlightShape: "rectangle",
    },
    {
      id: "approveButton",
      targetKey: "approveButton",
      narration: "Tap this to choose this person to help you. The others will no longer be available to choose.",
      highlightShape: "rectangle",
    },
    {
      id: "rejectButton",
      targetKey: "rejectButton",
      narration: "Tap this if you don't want this person's help. You can add a short note, but you don't have to.",
      highlightShape: "rectangle",
    },
  ],
};

export default applicantReviewGuide;
