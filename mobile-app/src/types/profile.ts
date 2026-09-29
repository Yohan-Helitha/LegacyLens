/**
 * Mirrors lk.ac.sliit.legacylens.users.dto.* — the authenticated
 * "my own account" endpoints under /api/users/**.
 */
import { City } from './city';

export interface UserProfile {
  userId: string;
  fullName: string;
  phoneNumber: string;
  phoneVerified: boolean;
  /** ISO 8601 date, e.g. "1998-04-12" */
  dateOfBirth: string;
  nicNumber: string;
  profilePhotoUrl: string | null;
  fingerprintEnabled: boolean;
  accountStatus: string;
  city: City | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

/** Only covers fields that don't need OTP verification — see the RequestPhoneChange/RequestNicChange flows for those. */
export interface UpdateProfileRequest {
  fullName: string;
  cityId: number | null;
}

export interface RequestPhoneChangeRequest {
  newPhoneNumber: string;
}

export interface ConfirmPhoneChangeRequest {
  newPhoneNumber: string;
  otpCode: string;
}

export interface RequestNicChangeRequest {
  newNicNumber: string;
}

export interface ConfirmNicChangeRequest {
  newNicNumber: string;
  otpCode: string;
}

export interface ConfirmPinChangeRequest {
  newPin: string;
  confirmNewPin: string;
  otpCode: string;
}
