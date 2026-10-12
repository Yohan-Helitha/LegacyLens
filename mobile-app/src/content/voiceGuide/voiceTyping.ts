import type { VoiceGuidePage } from "./types";

/** VoiceTypingScreen.tsx — reached after choosing "Written" on Share your story. */
export const voiceTypingGuide: VoiceGuidePage = {
  pageKey: "voiceTyping",
  title: "Write by Speaking",
  introNarration:
    "This screen writes down your story as you say it. Speak a little, pause, and your words appear — then speak again to keep going.",
  steps: [
    {
      id: "closeButton",
      targetKey: "closeButton",
      narration: "This closes the screen without saving anything.",
      highlightShape: "circle",
    },
    {
      id: "transcriptBox",
      targetKey: "transcriptBox",
      narration: "Your words appear here as text. You can also tap inside and type or fix anything by hand.",
      highlightShape: "rectangle",
    },
    {
      id: "micOrb",
      targetKey: "micOrb",
      narration: "Tap this to start speaking, and tap it again when you've finished that part of your story.",
      highlightShape: "circle",
    },
    {
      id: "startOverButton",
      targetKey: "startOverButton",
      narration: "This clears everything and lets you begin again.",
      highlightShape: "rectangle",
    },
    {
      id: "doneButton",
      targetKey: "doneButton",
      narration: "When your story is finished, tap Done to continue.",
      highlightShape: "rectangle",
    },
  ],
};

export default voiceTypingGuide;
