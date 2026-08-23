package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.dto.LearningDashboardResponse;
import lk.ac.sliit.legacylens.learning.dto.TrackDashboardResponse;
import lk.ac.sliit.legacylens.learning.service.LearningDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learning/dashboard")
public class LearningDashboardController {

    private final LearningDashboardService learningDashboardService;

    public LearningDashboardController(
            LearningDashboardService learningDashboardService) {

        this.learningDashboardService = learningDashboardService;
    }

    @GetMapping("/me")
    public ResponseEntity<LearningDashboardResponse> getMyDashboard(
            Authentication authentication) {

        Long userId =
                Long.valueOf(authentication.getName());

        return ResponseEntity.ok(
                learningDashboardService.getDashboard(userId)
        );
    }

    @GetMapping("/me/tracks/{trackId}")
    public ResponseEntity<TrackDashboardResponse> getMyTrackDashboard(
            Authentication authentication,
            @PathVariable Long trackId) {

        Long userId =
                Long.valueOf(authentication.getName());

        return ResponseEntity.ok(
                learningDashboardService
                        .getTrackDashboard(userId, trackId)
        );
    }
}