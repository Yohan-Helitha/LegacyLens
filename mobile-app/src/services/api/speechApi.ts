import { apiClient } from './client';
import type { TranscriptionResponse } from '../../types/speech';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * POST /api/speech/transcribe — record-then-transcribe, not live streaming.
 * A longer timeout than apiClient's default 15s: the backend's own request
 * can take a few seconds (Azure call + one retry), and this is a single
 * interactive call the elder is waiting on, not a background sync.
 */
const TRANSCRIBE_TIMEOUT_MS = 20000;

/**
 * Uploads a recorded clip and returns its transcript. `fileUri` is a local
 * file:// URI (from useAudioRecorder) — React Native's FormData accepts the
 * {uri, name, type} shape directly for a file part.
 */
async function transcribe(fileUri: string, language?: string): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('audio', {
    uri: fileUri,
    name: 'voice-input.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  if (language) {
    formData.append('language', language);
  }

  const response = await apiClient.post<ApiEnvelope<TranscriptionResponse>>('/speech/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: TRANSCRIBE_TIMEOUT_MS,
  });

  return response.data.data as TranscriptionResponse;
}

export const speechApi = { transcribe };

export default speechApi;
