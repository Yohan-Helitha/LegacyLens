package lk.ac.sliit.legacylens.learning.certificate;

import lk.ac.sliit.legacylens.learning.dto.CertificateVerificationResponse;
import lk.ac.sliit.legacylens.learning.dto.IssuedCertificateResponse;

import java.util.List;
import java.util.UUID;

public interface CertificateIssuer {

	IssuedCertificateResponse issueCertificate(UUID userId, String learnerName, Long trackId);

	List<IssuedCertificateResponse> getMyCertificates(UUID userId);

	CertificateVerificationResponse verifyCertificate(String verificationCode);
}
