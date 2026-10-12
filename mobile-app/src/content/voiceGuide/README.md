# Voice Help guides

Per-page narration scripts for the content-capture module's planned "Voice
Help" feature: the elder opens the side drawer on any page and presses
**Voice Help**; the app darkens the screen, spotlights one element at a
time (a rectangle or circle cutout in the dim overlay, the way a mobile
game's tutorial highlights the button it wants you to press), and plays
narration explaining what that element does, before moving to the next one.

**This folder is the content only.** It is plain data — thirteen pages, one
file each, every narration line written in English so it can be handed to a
translator for Sinhala. **The engine that actually renders the dark
overlay, draws the spotlight cutout, animates a hand cursor, and plays the
narration audio has not been built yet.** That's a separate, fairly large
piece of work (screen-element measurement, an animated SVG mask, a
cursor sprite, and either text-to-speech or recorded audio per language).
This package is written so that engine has a clean, typed source to consume
once it exists — see "What's not decided yet" below for the open questions
building it will need answered.

## Files

```
types.ts              VoiceGuidePage / VoiceGuideStep — the schema every page file follows
dashboard.ts           elder_dashboard.tsx        — "Home"
yourStories.ts          your_stories.tsx           — "My Stories"
trustScore.ts           trust_score_detail.tsx     — "Trust Score"
reviews.ts               ReviewsRatingsScreen.tsx   — "Reviews & Ratings"
chooseMethod.ts          ChooseCaptureMethodScreen.tsx — "Share your story"
audioRecording.ts        AudioRecordingScreen.tsx
videoRecording.ts        VideoRecordingScreen.tsx
voiceTyping.ts           VoiceTypingScreen.tsx      — "Write by Speaking"
contentForm.ts           ContentFormScreen.tsx      — create and edit, same guide
postHireRequest.ts       PostHireRequestScreen.tsx  — "Request Help from a Content Creator"
myHireRequests.ts        MyHireRequestsScreen.tsx   — "My Requests"
applicantReview.ts       ApplicantReviewScreen.tsx  — "Replies for Your Request"
hireConversation.ts      HireConversationScreen.tsx — message thread
index.ts                 VOICE_GUIDES — every page's guide, keyed by pageKey
```

## The schema

```ts
interface VoiceGuidePage {
  pageKey: string;          // e.g. "dashboard" — matches ElderDrawerItem/the navigator's Step where one exists
  title: string;             // the page's own name, spoken first
  introNarration: string;    // one or two sentences orienting the elder to the whole page
  steps: VoiceGuideStep[];
  outroNarration?: string;   // optional short sign-off after the last step
}

interface VoiceGuideStep {
  id: string;                 // stable within the page; a React key, never spoken
  targetKey: string;          // which element to spotlight — see "Wiring a screen up"
  narration: string;          // what's spoken for this step
  highlightShape: 'rectangle' | 'circle' | 'none';
  isListItem?: boolean;       // true for a repeated element (a story card, a request card) — see below
}
```

## Wiring a screen up (for whoever builds the engine)

Nothing in the actual screens references this package yet. The intended
shape: each screen that has a guide wraps its key elements in a small
wrapper (or attaches a ref via a hook) tagged with the matching `targetKey`
— e.g. the dashboard's record button would be registered under
`"recordButton"`, matching `dashboardGuide.steps[...].targetKey`. The engine
measures that element (`measureInWindow`) to position the spotlight cutout
and the hand cursor. `pageKey` is how the engine knows which guide to play
for whatever screen is currently on top — it's deliberately the same string
the navigators already use for their own step/drawer-item names, so no new
mapping table is needed there.

## `isListItem`

Several screens show a variable number of the same card (a story, a hire
request, an applicant). A step with `isListItem: true` describes that card
generically ("Each of your stories looks like this…") — the engine should
spotlight just the first visible instance, or skip the cutout and narrate
only if the list happens to be empty at that moment.

## Deliberate simplification: the footer isn't repeated

`UserFooter`'s five tabs (Home, Learn, Market, Map, Profile) appear on most
of these pages. Explaining them on every single page the guide runs on
would make every guide longer and repetitive for no benefit, so they're
only covered once, in `dashboard.ts`. If a page's guide should mention the
footer too, add a step for it there — it was left out elsewhere on purpose,
not missed.

## What's not decided yet

- **Audio**: text-to-speech (e.g. `expo-speech`) reading `narration` aloud
  live, or pre-recorded audio files per language? TTS is simpler and free
  of recording work but may not support Sinhala with a natural voice;
  recorded audio sounds better but means re-recording every line whenever
  copy changes, in every language.
- **Sinhala/Tamil**: this package is English only, by request — the
  structure is ready for a `voiceGuide.si.ts`/`voiceGuide.ta.ts` sibling (or
  a nested dictionary) once translations exist, mirroring how
  `hireStrings.ts` keeps one dictionary per locale.
  Do not invent Sinhala or Tamil text.
- **Replaying mid-task screens**: Audio/Video/Voice-Typing recording is
  already in progress when Voice Help could be opened — the engine will
  need to pause recording (or decide not to allow Voice Help there at all)
  rather than narrate over an active recording.
- **ContentFormScreen's two variants**: creating a new story and editing an
  existing one use the same screen and the same guide here. Some steps
  (`deleteButton`, re-recording from `mediaPreview`) only apply to an
  existing story — the engine should skip a step if its `targetKey` isn't
  registered on the current render, the same handling `isListItem`'s empty
  case needs, rather than this content needing two near-duplicate page files.
