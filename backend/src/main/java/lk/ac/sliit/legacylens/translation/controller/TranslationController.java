package lk.ac.sliit.legacylens.translation.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.translation.dto.TranslateRequest;
import lk.ac.sliit.legacylens.translation.dto.TranslateResponse;
import lk.ac.sliit.legacylens.translation.service.TranslationRateLimiter;
import lk.ac.sliit.legacylens.translation.service.TranslationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * On-demand translation of user-written content into the viewer's language. Signed-in users only (the default
 * rule in SecurityConfig) and rate-limited per user, since every uncached character is billed by Google.
 */
@RestController
@RequestMapping("/api/translate")
public class TranslationController {

    private final TranslationService translationService;
    private final TranslationRateLimiter rateLimiter;

    public TranslationController(TranslationService translationService, TranslationRateLimiter rateLimiter) {
        this.translationService = translationService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TranslateResponse>> translate(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody TranslateRequest request) {

        rateLimiter.check(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok(
                new TranslateResponse(translationService.translate(request.getTexts(), request.getTarget()))));
    }
}
