import type { VoiceGuidePage } from './types';

/** trust_score_detail.tsx — "Trust Score" (shown as "Knowledge Keeper" in-app). */
export const trustScoreGuide: VoiceGuidePage = {
  pageKey: 'trustScore',
  title: 'Trust Score',
  introNarration:
    "This screen shows your Knowledge Keeper progress — an honoring record of how much you've shared, not a competition with anyone else.",
  steps: [
    {
      id: 'menuButton',
      targetKey: 'menuButton',
      narration: 'This button opens your menu.',
      highlightShape: 'circle',
    },
    {
      id: 'progressRing',
      targetKey: 'progressRing',
      narration: 'This ring shows your current level, and how close you are to the next one.',
      highlightShape: 'circle',
    },
    {
      id: 'storiesSharedCard',
      targetKey: 'storiesSharedCard',
      narration: "This shows exactly how many stories you've shared so far.",
      highlightShape: 'rectangle',
    },
    {
      id: 'milestoneList',
      targetKey: 'milestoneList',
      narration: 'This list shows each level, and how many more stories you need to reach the next one.',
      highlightShape: 'rectangle',
    },
    {
      id: 'reviewsLink',
      targetKey: 'reviewsLink',
      narration: 'Tap here to see what people have said about you, in Reviews and Ratings.',
      highlightShape: 'rectangle',
    },
  ],
};

export default trustScoreGuide;
