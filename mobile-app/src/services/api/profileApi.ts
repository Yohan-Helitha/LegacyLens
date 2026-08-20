import { apiGet, apiPost } from './client';
import {
  ConfirmNicChangeRequest,
  ConfirmPhoneChangeRequest,
  ConfirmPinChangeRequest,
  RequestNicChangeRequest,
  RequestPhoneChangeRequest,
  UserProfile,
} from '../../types/profile';

/** Typed wrappers around GET/POST /api/users/me/**. */
export const profileApi = {
  getMe: () => apiGet<UserProfile>('/users/me'),

  requestPhoneChange: (body: RequestPhoneChangeRequest) =>
    apiPost<void, RequestPhoneChangeRequest>('/users/me/phone/request-change', body),

  confirmPhoneChange: (body: ConfirmPhoneChangeRequest) =>
    apiPost<void, ConfirmPhoneChangeRequest>('/users/me/phone/confirm-change', body),

  requestNicChange: (body: RequestNicChangeRequest) =>
    apiPost<void, RequestNicChangeRequest>('/users/me/nic/request-change', body),

  confirmNicChange: (body: ConfirmNicChangeRequest) =>
    apiPost<void, ConfirmNicChangeRequest>('/users/me/nic/confirm-change', body),

  requestPinChange: () => apiPost<void, Record<string, never>>('/users/me/pin/request-change', {}),

  confirmPinChange: (body: ConfirmPinChangeRequest) =>
    apiPost<void, ConfirmPinChangeRequest>('/users/me/pin/confirm-change', body),
};
