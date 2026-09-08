package lk.ac.sliit.legacylens.admin.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.admin.dto.AdminBadgeRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminLandmarkRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminQuestRequest;
import lk.ac.sliit.legacylens.admin.service.AdminCulturalMapService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.map.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/cultural-map")
@RequiredArgsConstructor
public class AdminCulturalMapController {

    private final AdminCulturalMapService culturalMapService;

    @GetMapping("/landmarks")
    public ResponseEntity<ApiResponse<List<MapLandmarkResponse>>> getAllLandmarks() {
        return ResponseEntity.ok(ApiResponse.ok("Landmarks retrieved", culturalMapService.getAllLandmarks()));
    }

    @PostMapping("/landmarks")
    public ResponseEntity<ApiResponse<MapLandmarkResponse>> createLandmark(
            @Valid @RequestBody AdminLandmarkRequest request) {
        return ResponseEntity
                .ok(ApiResponse.ok("Landmark created successfully", culturalMapService.createLandmark(request)));
    }

    @PutMapping("/landmarks/{id}")
    public ResponseEntity<ApiResponse<MapLandmarkResponse>> updateLandmark(
            @PathVariable Long id,
            @Valid @RequestBody AdminLandmarkRequest request) {
        return ResponseEntity
                .ok(ApiResponse.ok("Landmark updated successfully", culturalMapService.updateLandmark(id, request)));
    }

    @DeleteMapping("/landmarks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLandmark(@PathVariable Long id) {
        culturalMapService.deleteLandmark(id);
        return ResponseEntity.ok(ApiResponse.ok("Landmark deleted successfully", null));
    }

    @GetMapping("/regions")
    public ResponseEntity<ApiResponse<List<RegionResponse>>> getAllRegions() {
        return ResponseEntity.ok(ApiResponse.ok("Regions retrieved", culturalMapService.getAllRegions()));
    }

    @PostMapping("/badges/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadBadgeImage(
            @RequestParam("file") MultipartFile file) {
        String url = culturalMapService.uploadBadgeImage(file);
        return ResponseEntity.ok(ApiResponse.ok("Badge image uploaded successfully", Map.of("imageUrl", url)));
    }

    @PostMapping("/badges")
    public ResponseEntity<ApiResponse<BadgeResponse>> saveBadge(
            @Valid @RequestBody AdminBadgeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Badge saved successfully", culturalMapService.saveBadge(request)));
    }

    @PostMapping("/quests")
    public ResponseEntity<ApiResponse<QuestResponse>> saveQuest(
            @Valid @RequestBody AdminQuestRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Quest saved successfully", culturalMapService.saveQuest(request)));
    }

    @DeleteMapping("/quests/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuest(@PathVariable Long id) {
        culturalMapService.deleteQuest(id);
        return ResponseEntity.ok(ApiResponse.ok("Quest deleted successfully", null));
    }

    @GetMapping("/quests/{questId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestionsForQuest(@PathVariable Long questId) {
        return ResponseEntity
                .ok(ApiResponse.ok("Questions retrieved", culturalMapService.getQuestionsForQuest(questId)));
    }
}
