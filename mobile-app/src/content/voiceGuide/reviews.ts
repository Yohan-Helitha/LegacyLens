import type { VoiceGuidePage } from './types';

/** ReviewsRatingsScreen.tsx — "Reviews & Ratings". */
export const reviewsGuide: VoiceGuidePage = {
  pageKey: 'reviews',
  title: 'Reviews & Ratings',
  introNarration:
    "This screen shows what the people you've worked with have said about you.",
  steps: [
    {
      id: 'menuButton',
      targetKey: 'menuButton',
      narration: 'This button opens your menu.',
      highlightShape: 'circle',
    },
    {
      id: 'summaryCard',
      targetKey: 'summaryCard',
      narration: 'This is your average rating, out of five stars, based on everyone who has reviewed you.',
      highlightShape: 'rectangle',
    },
    {
      id: 'reviewCard',
      targetKey: 'reviewCard',
      narration: 'Each review someone has left for you appears here, with their rating and what they said.',
      highlightShape: 'rectangle',
      isListItem: true,
    },
  ],
};

export default reviewsGuide;
