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

  console.log('API REQUEST:', config.url);
  console.log('JWT TOKEN EXISTS:', !!token);

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

/** Helper to robustly handle both enveloped and raw backend responses. */
function unwrapResponse<T>(data: any): T {
  if (data && typeof data === 'object' && !Array.isArray(data) && 'success' in data) {
    return data.data as T;
  }
  return data as T;
}

/** POST helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiPost<TResponse, TRequest = unknown>(
  url: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await apiClient.post<any>(url, body);
  console.log('FULL API RESPONSE:', response.data);
  return unwrapResponse<TResponse>(response.data);
}

/** PATCH helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiPatch<TResponse, TRequest = unknown>(
  url: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await apiClient.patch<any>(url, body);
  return unwrapResponse<TResponse>(response.data);
}

/** GET helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiGet<TResponse>(url: string): Promise<TResponse> {
  const response = await apiClient.get<any>(url);
  return unwrapResponse<TResponse>(response.data);
}

/** PUT helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiPut<TResponse, TRequest = unknown>(
  url: string,
  body: TRequest,
): Promise<TResponse> {
  const response = await apiClient.put<any>(url, body);
  return unwrapResponse<TResponse>(response.data);
}

/**
 * POST helper for multipart/form-data bodies (file uploads) — everything
 * else goes through apiPost's JSON path. Overrides the client's default
 * JSON content-type per request; RN's XHR layer fills in the boundary
 * itself once it sees a FormData body.
 */
export async function apiPostForm<TResponse>(url: string, formData: FormData): Promise<TResponse> {
  const response = await apiClient.post<any>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrapResponse<TResponse>(response.data);
}

/** DELETE helper that unwraps the ApiResponse envelope's `data` field. */
export async function apiDelete<TResponse = void>(url: string): Promise<TResponse> {
  const response = await apiClient.delete<any>(url);
  return unwrapResponse<TResponse>(response.data);
}
