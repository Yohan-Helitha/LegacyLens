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

    @GetMapping("/regions")
    public ResponseEntity<ApiResponse<List<lk.ac.sliit.legacylens.map.dto.RegionResponse>>> getAllRegions() {
        return ResponseEntity.ok(ApiResponse.ok("Regions retrieved", mapService.getAllRegions()));
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
        return ResponseEntity
                .ok(ApiResponse.ok("Badges retrieved", mapService.getMyBadges(principal.getUser().getId())));
    }

    @PostMapping("/my-badges/{badgeCode}")
    public ResponseEntity<ApiResponse<String>> unlockBadge(@AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable String badgeCode) {
        mapService.unlockBadge(principal.getUser().getId(), badgeCode);
        return ResponseEntity.ok(ApiResponse.ok("Badge unlocked successfully", badgeCode));
    }

    @PostMapping("/landmarks")
    public ResponseEntity<ApiResponse<MapLandmarkResponse>> createLandmark(
            @jakarta.validation.Valid @RequestBody lk.ac.sliit.legacylens.map.dto.CreateLandmarkRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Landmark created successfully", mapService.createLandmark(request)));
    }

    @PutMapping("/landmarks/{id}")
    public ResponseEntity<ApiResponse<MapLandmarkResponse>> updateLandmark(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody lk.ac.sliit.legacylens.map.dto.CreateLandmarkRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Landmark updated successfully", mapService.updateLandmark(id, request)));
    }

    @DeleteMapping("/landmarks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLandmark(@PathVariable Long id) {
        mapService.deleteLandmark(id);
        return ResponseEntity.ok(ApiResponse.ok("Landmark deleted successfully", null));
    }

    @PostMapping("/badges/upload")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> uploadBadgeImage(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String url = mapService.uploadBadgeImage(file);
        return ResponseEntity.ok(ApiResponse.ok("Badge image uploaded successfully", java.util.Map.of("imageUrl", url)));
    }

    @PostMapping("/badges")
    public ResponseEntity<ApiResponse<lk.ac.sliit.legacylens.map.dto.BadgeResponse>> saveBadge(
            @jakarta.validation.Valid @RequestBody lk.ac.sliit.legacylens.map.dto.SaveBadgeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Badge saved successfully", mapService.saveBadge(request)));
    }

    @PostMapping("/quests")
    public ResponseEntity<ApiResponse<lk.ac.sliit.legacylens.map.dto.QuestResponse>> saveQuest(
            @jakarta.validation.Valid @RequestBody lk.ac.sliit.legacylens.map.dto.SaveQuestRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Quest saved successfully", mapService.saveQuest(request)));
    }

    @DeleteMapping("/quests/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuest(@PathVariable Long id) {
        mapService.deleteQuest(id);
        return ResponseEntity.ok(ApiResponse.ok("Quest deleted successfully", null));
    }

    @PostMapping("/seed")
    public ResponseEntity<ApiResponse<String>> triggerSeedData() {
        mapService.seedData();
        return ResponseEntity.ok(ApiResponse.ok("Seed triggered", null));
    }
}
