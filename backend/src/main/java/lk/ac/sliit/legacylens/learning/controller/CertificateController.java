package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.learning.dto.CertificateResponse;
import lk.ac.sliit.legacylens.learning.service.CertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learning/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/me/tracks/{trackId}")
    public ResponseEntity<CertificateResponse> getMyCertificate(
            Authentication authentication,
            @PathVariable Long trackId) {

        // Long userId here is the existing (phone-number-based) key used
        // to look up lesson progress — see CertificateService's note.
        Long userId = Long.valueOf(authentication.getName());

        // The real learner name comes straight off the authenticated
        // User entity, not from that Long userId.
        CustomUserDetails userDetails =
                (CustomUserDetails) authentication.getPrincipal();
        String learnerName = userDetails.getUser().getFullName();

        return ResponseEntity.ok(
                certificateService.getCertificate(
                        userId,
                        learnerName,
                        trackId
                )
        );
    }
}