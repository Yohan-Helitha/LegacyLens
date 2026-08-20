import { apiPost } from './client';
import {
  AuthResponse,
  ForgotPinRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResetPinRequest,
  VerifyOtpRequest,
} from '../../types/auth';

/** Typed wrappers around POST /api/auth/**. */
export const authApi = {
  register: (body: RegisterRequest) =>
    apiPost<RegisterResponse, RegisterRequest>('/auth/register', body),

  verifyOtp: (body: VerifyOtpRequest) =>
    apiPost<AuthResponse, VerifyOtpRequest>('/auth/verify-otp', body),

  resendOtp: (body: ResendOtpRequest) =>
    apiPost<void, ResendOtpRequest>('/auth/resend-otp', body),

  login: (body: LoginRequest) => apiPost<AuthResponse, LoginRequest>('/auth/login', body),

  forgotPin: (body: ForgotPinRequest) =>
    apiPost<void, ForgotPinRequest>('/auth/forgot-pin', body),

  /** Checks a PIN-reset OTP without consuming it — resetPin() still validates it for real. */
  verifyResetOtp: (body: VerifyOtpRequest) =>
    apiPost<void, VerifyOtpRequest>('/auth/verify-reset-otp', body),

  resetPin: (body: ResetPinRequest) =>
    apiPost<AuthResponse, ResetPinRequest>('/auth/reset-pin', body),
};
