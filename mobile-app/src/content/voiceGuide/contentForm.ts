import type { VoiceGuidePage } from "./types";

/**
 * ContentFormScreen.tsx — used both for a brand new story (after
 * recording) and for opening an existing one. The two narration variants
 * below share the same step keys so the engine can swap only the wording
 * that differs, rather than needing two separate page guides.
 */
export const contentFormGuide: VoiceGuidePage = {
  pageKey: "form",
  title: "Review Your Story",
  introNarration:
    "This screen is where you give your story a title and a little detail before it's shared.",
  steps: [
    {
      id: "backButton",
      targetKey: "backButton",
      narration: "This takes you back. If you've made changes, it will ask whether to keep them.",
      highlightShape: "circle",
    },
    {
      id: "titleField",
      targetKey: "titleField",
      narration: "Give your story a short title here, by typing or by tapping the microphone and speaking.",
      highlightShape: "rectangle",
    },
    {
      id: "descriptionField",
      targetKey: "descriptionField",
      narration: "Add a little context here — what the story is about, or when it happened.",
      highlightShape: "rectangle",
    },
    {
      id: "mediaPreview",
      targetKey: "mediaPreview",
      narration: "This plays back your recording. If it's not right yet, you can re-record it from here.",
      highlightShape: "rectangle",
    },
    {
      id: "thumbnailPicker",
      targetKey: "thumbnailPicker",
      narration: "You can add a picture here to represent your story — this step is optional.",
      highlightShape: "rectangle",
    },
    {
      id: "deleteButton",
      targetKey: "deleteButton",
      narration: "This removes the story completely. It cannot be undone.",
      highlightShape: "rectangle",
    },
    {
      id: "saveAsDraftButton",
      targetKey: "saveAsDraftButton",
      narration: "Tap this to save what you have and come back to finish it later.",
      highlightShape: "rectangle",
    },
    {
      id: "submitButton",
      targetKey: "submitButton",
      narration: "When you're ready, tap this to send your story in for review.",
      highlightShape: "rectangle",
    },
  ],
};

export default contentFormGuide;
