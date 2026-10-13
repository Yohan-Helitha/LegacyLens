import type { VoiceGuidePage } from "./types";
import { dashboardGuide } from "./dashboard";
import { yourStoriesGuide } from "./yourStories";
import { trustScoreGuide } from "./trustScore";
import { reviewsGuide } from "./reviews";
import { chooseMethodGuide } from "./chooseMethod";
import { audioRecordingGuide } from "./audioRecording";
import { videoRecordingGuide } from "./videoRecording";
import { voiceTypingGuide } from "./voiceTyping";
import { contentFormGuide } from "./contentForm";
import { postHireRequestGuide } from "./postHireRequest";
import { myHireRequestsGuide } from "./myHireRequests";
import { applicantReviewGuide } from "./applicantReview";
import { hireConversationGuide } from "./hireConversation";

export type { VoiceGuidePage, VoiceGuideStep, VoiceGuideHighlightShape } from "./types";

/** Every content-capture page's guide, keyed by the same pageKey each guide carries — see the README. */
export const VOICE_GUIDES: Record<string, VoiceGuidePage> = {
  [dashboardGuide.pageKey]: dashboardGuide,
  [yourStoriesGuide.pageKey]: yourStoriesGuide,
  [trustScoreGuide.pageKey]: trustScoreGuide,
  [reviewsGuide.pageKey]: reviewsGuide,
  [chooseMethodGuide.pageKey]: chooseMethodGuide,
  [audioRecordingGuide.pageKey]: audioRecordingGuide,
  [videoRecordingGuide.pageKey]: videoRecordingGuide,
  [voiceTypingGuide.pageKey]: voiceTypingGuide,
  [contentFormGuide.pageKey]: contentFormGuide,
  [postHireRequestGuide.pageKey]: postHireRequestGuide,
  [myHireRequestsGuide.pageKey]: myHireRequestsGuide,
  [applicantReviewGuide.pageKey]: applicantReviewGuide,
  [hireConversationGuide.pageKey]: hireConversationGuide,
};

export {
  dashboardGuide,
  yourStoriesGuide,
  trustScoreGuide,
  reviewsGuide,
  chooseMethodGuide,
  audioRecordingGuide,
  videoRecordingGuide,
  voiceTypingGuide,
  contentFormGuide,
  postHireRequestGuide,
  myHireRequestsGuide,
  applicantReviewGuide,
  hireConversationGuide,
};

export default VOICE_GUIDES;
