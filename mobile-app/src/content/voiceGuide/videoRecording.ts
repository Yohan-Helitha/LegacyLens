import type { VoiceGuidePage } from "./types";

/** VideoRecordingScreen.tsx. */
export const videoRecordingGuide: VoiceGuidePage = {
  pageKey: "videoRecording",
  title: "Recording Video",
  introNarration: "This screen records you on camera while you tell your story.",
  steps: [
    {
      id: "closeButton",
      targetKey: "closeButton",
      narration: "This closes the recording without saving it.",
      highlightShape: "circle",
    },
    {
      id: "grantAccessButton",
      targetKey: "grantAccessButton",
      narration:
        "If you see this button, Legacy Lens needs your permission to use the camera and microphone. Tap it and allow access.",
      highlightShape: "rectangle",
    },
    {
      id: "recordButton",
      targetKey: "recordButton",
      narration: "Once the camera is ready, tap this round button in the middle to start recording.",
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

export default videoRecordingGuide;
