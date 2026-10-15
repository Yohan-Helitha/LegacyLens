/**
 * Shared types for the content-capture module's per-page Voice Help guides
 * — see this folder's README for the full picture (what these are, how a
 * page is expected to wire itself up, and what's not built yet).
 */

/** How the spotlight cutout should be drawn around a step's target element. */
export type VoiceGuideHighlightShape =
  | 'rectangle'
  | 'circle'
  /** No single element to spotlight — the narration stands on its own, background still dims. */
  | 'none';

export interface VoiceGuideStep {
  /** Stable id within the page — used for QA/debugging and as a React key, never shown to the elder. */
  id: string;
  /**
   * The key a screen registers its element under (see the README's "Wiring
   * a screen up" section) so the engine can measure it and draw the
   * spotlight cutout in the right place. Meaningless on its own when
   * `highlightShape` is 'none'.
   */
  targetKey: string;
  /** Spoken aloud for this step — one or two short sentences, elder-friendly pace. English source text; translate the VALUES only, never the keys/ids. */
  narration: string;
  highlightShape: VoiceGuideHighlightShape;
  /**
   * True when `targetKey` resolves to one of several repeated items (a
   * story card, a request card, an applicant card) rather than a single
   * fixed button. The engine should spotlight just the first visible
   * instance, or skip the cutout (narration only) if the list is empty.
   */
  isListItem?: boolean;
}

export interface VoiceGuidePage {
  /** Matches ElderDrawerItem / the navigator's Step where one exists — lets the engine know which guide to play for the screen currently on top. */
  pageKey: string;
  /** The page's own name, spoken as the very first thing, e.g. "This is your Home screen." */
  title: string;
  /** Said once, before any step — orients the elder to what this whole page is for. */
  introNarration: string;
  steps: VoiceGuideStep[];
  /** Said once, after the last step — optional, for pages where a short sign-off reads naturally. */
  outroNarration?: string;
}
