// mobile-app/src/services/api/studyBuilderApi.ts
import { apiGet, apiPost, apiDelete } from './client';
import {
  SourceContentSummary,
  CreateStudyJobRequest,
  StudyJobResponse,
  StudySetSummary,
  StudySetDetail,
  SubmitStudyAttemptRequest,
  StudyAttemptResult,
} from '../../types/studyBuilder';

export const studyBuilderApi = {
  /** Search approved community story content for the AI Study Builder. */
  async searchContent(params?: {
    query?: string;
    region?: string;
    occupation?: string;
    page?: number;
    size?: number;
  }): Promise<SourceContentSummary[]> {
    const queryParts: string[] = [];
    if (params?.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
    if (params?.region) queryParts.push(`region=${encodeURIComponent(params.region)}`);
    if (params?.occupation) queryParts.push(`occupation=${encodeURIComponent(params.occupation)}`);
    if (params?.page !== undefined) queryParts.push(`page=${params.page}`);
    if (params?.size !== undefined) queryParts.push(`size=${params.size}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    return apiGet<SourceContentSummary[]>(`/learning/builder/content${queryString}`);
  },

  /** Check current learner's remaining daily AI generation quota. */
  async getQuota(): Promise<{ dailyLimit: number; remainingQuota: number }> {
    return apiGet<{ dailyLimit: number; remainingQuota: number }>('/learning/builder/quota');
  },

  /** Start an asynchronous study set generation job. */
  async createJob(request: CreateStudyJobRequest): Promise<StudyJobResponse> {
    return apiPost<StudyJobResponse>('/learning/builder/jobs', request);
  },

  /** Poll the status of a generation job and retrieve generated preview. */
  async getJob(jobId: number | string): Promise<StudyJobResponse> {
    return apiGet<StudyJobResponse>(`/learning/builder/jobs/${jobId}`);
  },

  /** Save a successfully generated study set to learner's private study tracks. */
  async saveJob(jobId: number | string): Promise<{ trackId: number }> {
    return apiPost<{ trackId: number }>(`/learning/builder/jobs/${jobId}/save`, {});
  },

  /** Discard a generated job. */
  async deleteJob(jobId: number | string): Promise<void> {
    return apiDelete<void>(`/learning/builder/jobs/${jobId}`);
  },

  /** Retrieve current learner's saved private study sets. */
  async getMyStudySets(): Promise<StudySetSummary[]> {
    return apiGet<StudySetSummary[]>('/learning/study-sets');
  },

  /** Retrieve full detail of a private study set (lessons, flashcards, questions, history). */
  async getMyStudySetDetail(trackId: number | string): Promise<StudySetDetail> {
    return apiGet<StudySetDetail>(`/learning/study-sets/${trackId}`);
  },

  /** Delete a private study set and its associated lessons. */
  async deleteMyStudySet(trackId: number | string): Promise<void> {
    return apiDelete<void>(`/learning/study-sets/${trackId}`);
  },

  /** Submit a quiz retake attempt on a private study set. */
  async submitStudyAttempt(
    trackId: number | string,
    request: SubmitStudyAttemptRequest,
  ): Promise<StudyAttemptResult> {
    return apiPost<StudyAttemptResult>(`/learning/study-sets/${trackId}/attempts`, request);
  },
};
