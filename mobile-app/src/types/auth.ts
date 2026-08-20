/**
 * Mirrors the request/response DTOs exposed by the backend's
 * lk.ac.sliit.legacylens.auth package (POST /api/auth/**).
 */

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  /** ISO 8601 date, e.g. "1998-04-12" */
  dateOfBirth: string;
  nicNumber: string;
  cityId: number;
  pin: string;
}

export interface RegisterResponse {
  userId: string;
  phoneNumber: string;
  message: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otpCode: string;
}

export interface ResendOtpRequest {
  phoneNumber: string;
}

export interface LoginRequest {
  phoneNumber: string;
  pin: string;
}

export interface ForgotPinRequest {
  phoneNumber: string;
  nicNumber: string;
}

export interface ResetPinRequest {
  phoneNumber: string;
  otpCode: string;
  newPin: string;
  confirmNewPin: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  roles: string[];
}
