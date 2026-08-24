/**
 * Mirrors lk.ac.sliit.legacylens.users.dto.StorytellerPreferencesRequest /
 * ConfirmStorytellerUpgradeRequest — POST /api/users/me/storyteller/**.
 */

export interface StorytellerPreferencesRequest {
  contentTypes: string[];
  topics: string[];
  otherTopic?: string;
}

export interface ConfirmStorytellerUpgradeRequest {
  otpCode: string;
}
