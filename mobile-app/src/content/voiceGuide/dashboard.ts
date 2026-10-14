import type { VoiceGuidePage } from './types';

/**
 * elder_dashboard.tsx — "Home". The footer's five tabs are explained here
 * only, not repeated on every other page — see the package README.
 */
export const dashboardGuide: VoiceGuidePage = {
  pageKey: 'dashboard',
  title: 'Home',
  introNarration:
    "This is your Home screen. It's the first thing you see when you open Legacy Lens, and it brings together everything you need in one place.",
  steps: [
    {
      id: 'menuButton',
      targetKey: 'menuButton',
      narration:
        'This button in the top left opens your menu. From there you can go to My Stories, your Trust Score, Reviews, Hire a Creator, and more.',
      highlightShape: 'circle',
    },
    {
      id: 'trustBadge',
      targetKey: 'trustBadge',
      narration:
        'This card shows your Knowledge Keeper level — it grows every time you share a story. Tap it to see your full progress.',
      highlightShape: 'rectangle',
    },
    {
      id: 'recordButton',
      targetKey: 'recordButton',
      narration:
        'This big button is how you record a new story. Tap it any time you want to share a memory — by speaking, by video, or by writing.',
      highlightShape: 'rectangle',
    },
    {
      id: 'requestCard',
      targetKey: 'requestCard',
      narration:
        'When someone asks you about a memory, it shows up here. Tap "Reply with voice" to answer them by speaking.',
      highlightShape: 'rectangle',
      isListItem: true,
    },
    {
      id: 'yourStoriesSection',
      targetKey: 'yourStoriesSection',
      narration:
        'This is a quick look at your most recent stories. Tap any one to open it, or tap "View All" to see your whole collection.',
      highlightShape: 'rectangle',
    },
    {
      id: 'balanceCard',
      targetKey: 'balanceCard',
      narration:
        "This card shows your balance — what you've earned from your stories. History shows past payments, and Withdraw sends your money to you.",
      highlightShape: 'rectangle',
    },
    {
      id: 'footerTabs',
      targetKey: 'footerTabs',
      narration:
        "These five buttons at the very bottom are always there. Home brings you back here. Learn, Market, Map, and Profile take you to the rest of the app.",
      highlightShape: 'rectangle',
    },
  ],
  outroNarration:
    "That's everything on this screen. You can replay this guide any time by opening the menu and pressing Voice Help.",
};

export default dashboardGuide;
