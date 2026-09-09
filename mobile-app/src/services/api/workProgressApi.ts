import { apiClient, apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import { WorkMaterialFile, WorkProgressResponse } from '../../types/workProgress';

/** Matches ApiEnvelope in client.ts — not exported there, so mirrored here. */
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/** Typed wrappers around /api/jobs/{jobId}/work-progress/** — backs MyWorkList and ContinueMyWorkPage. */
export const workProgressApi = {
  getProgress: (jobId: string) =>
    apiGet<WorkProgressResponse>(`/jobs/${jobId}/work-progress`),

  /** Checks/unchecks one required task — the only action that ever changes progressPercentage. */
  updateChecklistItem: (jobId: string, checklistItemId: string, completed: boolean) =>
    apiPatch<WorkProgressResponse, { completed: boolean }>(
      `/jobs/${jobId}/work-progress/checklist/${checklistItemId}`,
      { completed },
    ),

  updateNote: (jobId: string, note: string) =>
    apiPut<WorkProgressResponse, { note: string }>(`/jobs/${jobId}/work-progress/note`, { note }),

  markDraft: (jobId: string) =>
    apiPost<WorkProgressResponse, undefined>(`/jobs/${jobId}/work-progress/draft`, undefined),

  submitDraft: (jobId: string) =>
    apiPost<WorkProgressResponse, undefined>(`/jobs/${jobId}/work-progress/submit`, undefined),

  resetProgress: (jobId: string) => apiDelete<void>(`/jobs/${jobId}/work-progress`),

  /** multipart/form-data — same file-part pattern as creatorDashboardApi.addPayment. */
  addMaterial: async (jobId: string, file: WorkMaterialFile): Promise<WorkProgressResponse> => {
    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
      // React Native's FormData accepts this file-part shape; axios's
      // browser-oriented Blob/File typing doesn't model it, hence the cast.
    } as unknown as Blob);

    const response = await apiClient.post<ApiEnvelope<WorkProgressResponse>>(
      `/jobs/${jobId}/work-progress/materials`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data.data as WorkProgressResponse;
  },

  removeMaterial: (jobId: string, materialId: string) =>
    apiDelete<WorkProgressResponse>(`/jobs/${jobId}/work-progress/materials/${materialId}`),
};
