import { apiPost } from './client';
import { AuthResponse } from '../../types/auth';
import {
  ConfirmStorytellerUpgradeRequest,
  StorytellerPreferencesRequest,
} from '../../types/storyteller';

/** Typed wrappers around POST /api/users/me/storyteller/**. */
export const storytellerApi = {
  /** Saves the intake answers and sends an OTP to the user's phone. */
  requestUpgrade: (body: StorytellerPreferencesRequest) =>
    apiPost<void, StorytellerPreferencesRequest>('/users/me/storyteller/request', body),

  /** Verifies the OTP and activates the ELDER role — returns a fresh token with the new role claim. */
  confirmUpgrade: (body: ConfirmStorytellerUpgradeRequest) =>
    apiPost<AuthResponse, ConfirmStorytellerUpgradeRequest>('/users/me/storyteller/confirm', body),
};
