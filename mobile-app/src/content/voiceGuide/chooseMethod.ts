import type { VoiceGuidePage } from './types';

/** ChooseCaptureMethodScreen.tsx — "Share your story". */
export const chooseMethodGuide: VoiceGuidePage = {
  pageKey: 'method',
  title: 'Share your story',
  introNarration: "This screen asks how you'd like to tell your story. Pick whichever feels easiest.",
  steps: [
    {
      id: 'backButton',
      targetKey: 'backButton',
      narration: 'This takes you back to where you came from.',
      highlightShape: 'circle',
    },
    {
      id: 'audioCard',
      targetKey: 'audioCard',
      narration: 'Choose Audio to simply speak, and we will record your voice.',
      highlightShape: 'rectangle',
    },
    {
      id: 'videoCard',
      targetKey: 'videoCard',
      narration: 'Choose Video to record yourself on camera while you talk.',
      highlightShape: 'rectangle',
    },
    {
      id: 'writtenCard',
      targetKey: 'writtenCard',
      narration: "Choose Written if you'd rather speak and have us write it down as words, with no recording kept.",
      highlightShape: 'rectangle',
    },
  ],
};

export default chooseMethodGuide;
