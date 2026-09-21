export interface LoginRequest {
  phoneNumber: string;
  pin: string;
  rememberDevice?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  nicNumber: string;
  cityId: number;
  pin: string;
  roleType?: string;
}

export interface City {
  id: number;
  name: string;
  region?: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  phoneNumber?: string;
  roles?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  nicNumber?: string;
  roles: string[];
}
