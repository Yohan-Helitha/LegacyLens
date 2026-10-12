// mobile-app/src/types/certificate.ts

export interface IssuedCertificate {
  id: number;
  trackId: number;
  trackTitle: string;
  learnerName: string;
  verificationCode: string;
  certificateType: 'ADMIN_TRACK' | 'AI_COURSE';
  issueDate: string;
  verifyUrl: string;
}

export interface CertificateVerification {
  valid: boolean;
  learnerDisplayName: string | null;
  trackTitle: string | null;
  certificateType: string | null;
  issueDate: string | null;
  verificationCode: string;
}
