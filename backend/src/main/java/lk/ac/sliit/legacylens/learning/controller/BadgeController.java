package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.dto.BadgeResponse;
import lk.ac.sliit.legacylens.learning.service.BadgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/learning/badges")
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<BadgeResponse>> getMyBadges(
            Authentication authentication) {

        Long userId = Long.valueOf(authentication.getName());

        return ResponseEntity.ok(
                badgeService.getMyBadges(userId)
        );
    }
}