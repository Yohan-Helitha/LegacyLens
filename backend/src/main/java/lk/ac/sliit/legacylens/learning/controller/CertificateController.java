package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.certificate.CertificateIssuer;
import lk.ac.sliit.legacylens.learning.dto.CertificateVerificationResponse;
import lk.ac.sliit.legacylens.learning.dto.IssuedCertificateResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning/certificates")
public class CertificateController {

	private final CertificateIssuer certificateIssuer;

	public CertificateController(CertificateIssuer certificateIssuer) {
		this.certificateIssuer = certificateIssuer;
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<List<IssuedCertificateResponse>>> getMyCertificates(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		List<IssuedCertificateResponse> certificates = certificateIssuer.getMyCertificates(userId);

		return ResponseEntity.ok(ApiResponse.ok(certificates));
	}

	@PostMapping("/me/tracks/{trackId}")
	public ResponseEntity<ApiResponse<IssuedCertificateResponse>> issueMyCertificate(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long trackId) {
		UUID userId = principal.getUser().getId();
		String learnerName = principal.getUser().getFullName();
		IssuedCertificateResponse certificate = certificateIssuer.issueCertificate(
				userId,
				learnerName,
				trackId
		);

		return ResponseEntity.ok(ApiResponse.ok("Certificate issued successfully", certificate));
	}

	@GetMapping("/me/tracks/{trackId}")
	public ResponseEntity<ApiResponse<IssuedCertificateResponse>> getMyCertificateForTrack(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long trackId) {
		UUID userId = principal.getUser().getId();
		String learnerName = principal.getUser().getFullName();
		IssuedCertificateResponse certificate = certificateIssuer.issueCertificate(
				userId,
				learnerName,
				trackId
		);

		return ResponseEntity.ok(ApiResponse.ok(certificate));
	}

	@GetMapping("/verify/{code}")
	public ResponseEntity<ApiResponse<CertificateVerificationResponse>> verifyCertificate(
			@PathVariable String code) {
		CertificateVerificationResponse response = certificateIssuer.verifyCertificate(code);

		return ResponseEntity.ok(ApiResponse.ok(response));
	}
}