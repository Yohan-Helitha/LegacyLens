import { apiGet, apiPatch, apiPost } from './client';
import {
  ConfirmNicChangeRequest,
  ConfirmPhoneChangeRequest,
  ConfirmPinChangeRequest,
  RequestNicChangeRequest,
  RequestPhoneChangeRequest,
  UpdateProfileRequest,
  UserProfile,
} from '../../types/profile';

/** Typed wrappers around GET/PATCH/POST /api/users/me/**. */
export const profileApi = {
  getMe: () => apiGet<UserProfile>('/users/me'),

  /** Full name / city only — phone/NIC/PIN go through the OTP-verified request/confirm flows below. */
  updateMe: (body: UpdateProfileRequest) => apiPatch<UserProfile, UpdateProfileRequest>('/users/me', body),

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
