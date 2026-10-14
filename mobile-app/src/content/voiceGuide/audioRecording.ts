import type { VoiceGuidePage } from "./types";

/** AudioRecordingScreen.tsx. Recording starts automatically on arrival, so the guide opens mid-recording. */
export const audioRecordingGuide: VoiceGuidePage = {
  pageKey: "audioRecording",
  title: "Recording Audio",
  introNarration:
    "This screen records your voice. It starts listening the moment you arrive, so you can begin speaking right away.",
  steps: [
    {
      id: "closeButton",
      targetKey: "closeButton",
      narration: "This closes the recording without saving it.",
      highlightShape: "circle",
    },
    {
      id: "pauseButton",
      targetKey: "pauseButton",
      narration: "Tap this to pause if you need a moment. Tap it again to keep recording.",
      highlightShape: "circle",
    },
    {
      id: "startOverButton",
      targetKey: "startOverButton",
      narration: "If you'd like to begin again from nothing, tap Start Over.",
      highlightShape: "rectangle",
    },
    {
      id: "useRecordingButton",
      targetKey: "useRecordingButton",
      narration: "When you're happy with what you've recorded, tap this to keep it and continue.",
      highlightShape: "rectangle",
    },
  ],
};

export default audioRecordingGuide;
