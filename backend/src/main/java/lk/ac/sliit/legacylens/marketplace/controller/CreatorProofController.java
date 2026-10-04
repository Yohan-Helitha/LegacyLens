package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.ProofLinkResponse;
import lk.ac.sliit.legacylens.marketplace.service.CreatorProofService;
import lk.ac.sliit.legacylens.marketplace.service.ProofDocument;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A creator's private verification document.
 *
 * POST /link needs a signed-in creator and returns a link to THEIR OWN document
 * only. GET /{token} is the link itself: it is open to the HTTP layer (an
 * image view or the phone's PDF viewer cannot send a login header) but is
 * useless without a valid, unexpired token, which only the owner can obtain.
 * The stored files under /uploads/creator-proofs are blocked outright.
 */
@RestController
@RequestMapping("/api/creator-proofs")
public class CreatorProofController {

    private final CreatorProofService proofService;

    public CreatorProofController(CreatorProofService proofService) {
        this.proofService = proofService;
    }

    @PostMapping("/link")
    public ResponseEntity<ApiResponse<ProofLinkResponse>> createLink(
            @AuthenticationPrincipal CustomUserDetails principal) {

        return ResponseEntity.ok(ApiResponse.ok(proofService.createLink(principal.getUser().getId())));
    }

    @GetMapping("/{token}")
    public ResponseEntity<Resource> open(@PathVariable String token) {
        ProofDocument document = proofService.open(token);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .cacheControl(CacheControl.noStore().cachePrivate())
                .body(new FileSystemResource(document.file()));
    }
}
