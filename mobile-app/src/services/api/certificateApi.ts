// mobile-app/src/services/api/certificateApi.ts
import { apiGet, apiPost } from './client';
import { IssuedCertificate, CertificateVerification } from '../../types/certificate';

export const certificateApi = {
  /** Fetch all certificates issued to the authenticated learner. */
  async getMyCertificates(): Promise<IssuedCertificate[]> {
    return apiGet<IssuedCertificate[]>('/learning/certificates/me');
  },

  /** Get or issue certificate for a specific completed track. */
  async getCertificateForTrack(trackId: number | string): Promise<IssuedCertificate> {
    return apiGet<IssuedCertificate>(`/learning/certificates/me/tracks/${trackId}`);
  },

  /** Explicitly issue a certificate for a completed track. */
  async issueCertificate(trackId: number | string): Promise<IssuedCertificate> {
    return apiPost<IssuedCertificate>(`/learning/certificates/me/tracks/${trackId}`, {});
  },

  /** Publicly verify a certificate using its unique code. */
  async verifyCertificate(code: string): Promise<CertificateVerification> {
    return apiGet<CertificateVerification>(`/learning/certificates/verify/${encodeURIComponent(code)}`);
  },
};
