import { apiClient, apiGet } from './client';
import {
  CreatorApplicationResponse,
  SubmitCreatorApplicationRequest,
} from '../../types/creatorApplication';

/** Matches ApiEnvelope in client.ts — not exported there, so mirrored here. */
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Typed wrappers around /api/creator-applications/**.
 *
 * submit() is multipart/form-data (the proof file rides alongside the form
 * fields) so it can't go through apiPost's JSON-only helper — it builds its
 * own FormData and posts directly via apiClient, overriding the instance's
 * default "application/json" Content-Type for just this one call.
 */
export const creatorApplicationApi = {
  getMe: () => apiGet<CreatorApplicationResponse>('/creator-applications/me'),

  submit: async (
    request: SubmitCreatorApplicationRequest,
  ): Promise<CreatorApplicationResponse> => {
    const form = new FormData();
    form.append('email', request.email);
    form.append('aboutYou', request.aboutYou);
    request.skills.forEach((skill) => form.append('skills', skill));
    request.interests.forEach((interest) => form.append('interests', interest));
    form.append('experienceLevel', request.experienceLevel);
    form.append('experienceDescription', request.experienceDescription);
    form.append('proofDocument', {
      uri: request.proofDocument.uri,
      name: request.proofDocument.name,
      type: request.proofDocument.type,
      // React Native's FormData accepts this file-part shape; axios's
      // browser-oriented Blob/File typing doesn't model it, hence the cast.
    } as unknown as Blob);

    const response = await apiClient.post<ApiEnvelope<CreatorApplicationResponse>>(
      '/creator-applications',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data.data as CreatorApplicationResponse;
  },
};
