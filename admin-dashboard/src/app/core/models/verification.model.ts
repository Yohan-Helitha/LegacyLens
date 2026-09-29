export interface AdminUserRoleDto {
  id: string;
  roleType: string;
  status: string;
  activatedAt?: string;
}

export interface AdminUserVerificationResponse {
  id: string;
  fullName: string;
  phoneNumber: string;
  phoneVerified: boolean;
  nicNumber: string;
  dateOfBirth: string;
  profilePhotoUrl?: string;
  accountStatus: string;
  cityId?: number;
  cityName?: string;
  cityRegion?: string;
  fingerprintEnabled: boolean;
  failedPinAttempts: number;
  roles: string[];
  roleDetails: AdminUserRoleDto[];
  verificationStatus: string;
  roleCategory: string;
  applyingTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserVerificationRequest {
  status: string;
  roleType?: string;
  notes?: string;
}

export interface VerificationProfile {
  id: string;
  name: string;
  roleCategory: 'Elder' | 'Artisan' | 'Historian';
  applyingTitle: string;
  nic: string;
  specialization: string;
  division: string;
  district: string;
  gnDivision: string;
  priority: 'Urgent' | 'High' | 'Normal';
  status: 'In Review' | 'Queued' | 'Pending Notes' | 'Approved' | 'Revision Requested';
  receivedTime: string;
  avatarUrl: string;
  yearsOfPractice: string;
  lineageDescription: string;
  endorsingBody: string;
  gnValidator: string;
  archiveImpact: string;
  archiveImpactDetail: string;
  statement: string;
  documents: {
    title: string;
    type: 'PDF' | 'JPG' | 'WAV';
    sizeOrDuration: string;
    subtext: string;
    imageUrl?: string;
  }[];
  rawUser?: AdminUserVerificationResponse;
}

