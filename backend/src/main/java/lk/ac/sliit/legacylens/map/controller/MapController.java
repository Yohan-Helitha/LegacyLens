package lk.ac.sliit.legacylens.map.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.map.dto.MapLandmarkResponse;
import lk.ac.sliit.legacylens.map.dto.QuestionResponse;
import lk.ac.sliit.legacylens.map.service.MapService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/map")
@RequiredArgsConstructor
public class MapController {

    private final MapService mapService;

    @GetMapping("/landmarks")
    public ResponseEntity<ApiResponse<List<MapLandmarkResponse>>> getAllLandmarks() {
        return ResponseEntity.ok(ApiResponse.ok("Landmarks retrieved", mapService.getAllLandmarks()));
    }

    @GetMapping("/badges")
    public ResponseEntity<ApiResponse<List<lk.ac.sliit.legacylens.map.dto.BadgeResponse>>> getAllBadges() {
        return ResponseEntity.ok(ApiResponse.ok("All badges retrieved", mapService.getAllBadges()));
    }

    @GetMapping("/quests/{questId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestionsForQuest(@PathVariable Long questId) {
        return ResponseEntity.ok(ApiResponse.ok("Questions retrieved", mapService.getQuestionsForQuest(questId)));
    }

    @GetMapping("/my-badges")
    public ResponseEntity<ApiResponse<List<String>>> getMyBadges(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok("Badges retrieved", mapService.getMyBadges(principal.getUser().getId())));
    }

    @PostMapping("/my-badges/{badgeCode}")
    public ResponseEntity<ApiResponse<String>> unlockBadge(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable String badgeCode) {
        mapService.unlockBadge(principal.getUser().getId(), badgeCode);
        return ResponseEntity.ok(ApiResponse.ok("Badge unlocked successfully", badgeCode));
    }

    @PostMapping("/seed")
    public ResponseEntity<ApiResponse<String>> triggerSeedData() {
        mapService.seedData();
        return ResponseEntity.ok(ApiResponse.ok("Seed triggered", null));
    }
}
