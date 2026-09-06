import axios, { AxiosError, AxiosInstance } from 'axios';
import { getApiBaseUrl } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';

/** Every backend response — success or error — is wrapped in this envelope. */
interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Normalized error thrown by every authApi call. Screens can catch this
 * directly and read `.message` for display, or `.fieldErrors` for a
 * field-name -> message map (present only on 400 validation failures).
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status?: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the current session token, if any — only relevant once
// authenticated-only endpoints exist; auth/** itself is all public.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Normalize every failure into an ApiError so calling code never has to
// know about axios/HTTP specifics.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (error.response) {
      const envelope = error.response.data;
      const status = error.response.status;
      const message = envelope?.message?.trim() || 'Something went wrong. Please try again.';
      const fieldErrors =
        envelope?.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)
          ? (envelope.data as Record<string, string>)
          : undefined;

      // There's no refresh-token flow on this backend — a 401 means the
      // session is gone for good, so drop it locally too.
      if (status === 401) {
        useAuthStore.getState().clearSession();
      }

      return Promise.reject(new ApiError(message, status, fieldErrors));
    }

    if (error.request) {
      return Promise.reject(
        new ApiError('Could not reach the server. Check your connection and try again.'),
      );
    }

    return Promise.reject(new ApiError(error.message || 'Something went wrong. Please try again.'));
  },
);

/** POST helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiPost<TResponse, TRequest = unknown>(
  url: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await apiClient.post<ApiEnvelope<TResponse>>(url, body);
  return response.data.data as TResponse;
}

/** GET helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiGet<TResponse>(url: string): Promise<TResponse> {
  const response = await apiClient.get<ApiEnvelope<TResponse>>(url);
  return response.data.data as TResponse;
}

/** DELETE helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiDelete<TResponse = void>(url: string): Promise<TResponse> {
  const response = await apiClient.delete<ApiEnvelope<TResponse>>(url);
  return response.data.data as TResponse;
}

/** PATCH helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiPatch<TResponse, TRequest = unknown>(
  url: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await apiClient.patch<ApiEnvelope<TResponse>>(url, body);
  return response.data.data as TResponse;
}
