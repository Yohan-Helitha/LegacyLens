package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.dto.BadgeResponse;
import lk.ac.sliit.legacylens.learning.service.BadgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning/badges")
public class BadgeController {

	private final BadgeService badgeService;

	public BadgeController(BadgeService badgeService) {
		this.badgeService = badgeService;
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<List<BadgeResponse>>> getMyBadges(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		List<BadgeResponse> badges = badgeService.getMyBadges(userId);

		return ResponseEntity.ok(ApiResponse.ok(badges));
	}
}