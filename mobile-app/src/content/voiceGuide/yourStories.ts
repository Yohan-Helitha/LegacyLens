import type { VoiceGuidePage } from './types';

/** your_stories.tsx — "My Stories". */
export const yourStoriesGuide: VoiceGuidePage = {
  pageKey: 'stories',
  title: 'My Stories',
  introNarration:
    "This is My Stories — every memory you've shared, all kept safely in one place for your family.",
  steps: [
    {
      id: 'menuButton',
      targetKey: 'menuButton',
      narration: 'This button opens your menu, so you can move to any other part of the app.',
      highlightShape: 'circle',
    },
    {
      id: 'searchBar',
      targetKey: 'searchBar',
      narration:
        "Use this to find a story. You can type a word, or tap the microphone on the right and just say what you're looking for.",
      highlightShape: 'rectangle',
    },
    {
      id: 'storyCard',
      targetKey: 'storyCard',
      narration: 'Each of your stories looks like this. Tap one to open it, listen to it, or make changes.',
      highlightShape: 'rectangle',
      isListItem: true,
    },
    {
      id: 'newStoryButton',
      targetKey: 'newStoryButton',
      narration: 'Tap this any time to record a brand new story.',
      highlightShape: 'rectangle',
    },
  ],
  outroNarration: 'That covers this screen. Open the menu and press Voice Help any time you want to hear it again.',
};

export default yourStoriesGuide;
