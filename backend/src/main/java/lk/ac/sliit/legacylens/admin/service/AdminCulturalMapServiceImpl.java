package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminBadgeRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminLandmarkRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminQuestRequest;
import lk.ac.sliit.legacylens.map.dto.*;
import lk.ac.sliit.legacylens.map.service.MapService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminCulturalMapServiceImpl implements AdminCulturalMapService {

    private final MapService mapService;

    @Override
    public List<MapLandmarkResponse> getAllLandmarks() {
        return mapService.getAllLandmarks();
    }

    @Override
    public List<RegionResponse> getAllRegions() {
        return mapService.getAllRegions();
    }

    @Override
    public MapLandmarkResponse createLandmark(AdminLandmarkRequest request) {
        CreateLandmarkRequest req = CreateLandmarkRequest.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
                .icon(request.getIcon())
                .image(request.getImage())
                .modelUrl(request.getModelUrl())
                .type(request.getType())
                .region(request.getRegion())
                .district(request.getDistrict())
                .attachedStoryIds(request.getAttachedStoryIds())
                .build();
        return mapService.createLandmark(req);
    }

    @Override
    public MapLandmarkResponse updateLandmark(Long id, AdminLandmarkRequest request) {
        CreateLandmarkRequest req = CreateLandmarkRequest.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
                .icon(request.getIcon())
                .image(request.getImage())
                .modelUrl(request.getModelUrl())
                .type(request.getType())
                .region(request.getRegion())
                .district(request.getDistrict())
                .attachedStoryIds(request.getAttachedStoryIds())
                .build();
        return mapService.updateLandmark(id, req);
    }

    @Override
    public void deleteLandmark(Long id) {
        mapService.deleteLandmark(id);
    }

    @Override
    public String uploadBadgeImage(MultipartFile file) {
        return mapService.uploadBadgeImage(file);
    }

    @Override
    public BadgeResponse saveBadge(AdminBadgeRequest request) {
        SaveBadgeRequest req = SaveBadgeRequest.builder()
                .landmarkId(request.getLandmarkId())
                .landmarkCode(request.getLandmarkCode())
                .badgeCode(request.getBadgeCode())
                .title(request.getTitle())
                .image(request.getImage())
                .build();
        return mapService.saveBadge(req);
    }

    @Override
    public QuestResponse saveQuest(AdminQuestRequest request) {
        SaveQuestRequest req = SaveQuestRequest.builder()
                .id(request.getId())
                .landmarkId(request.getLandmarkId())
                .landmarkCode(request.getLandmarkCode())
                .title(request.getTitle())
                .description(request.getDescription())
                .questions(request.getQuestions())
                .build();
        return mapService.saveQuest(req);
    }

    @Override
    public void deleteQuest(Long id) {
        mapService.deleteQuest(id);
    }

    @Override
    public List<QuestionResponse> getQuestionsForQuest(Long questId) {
        return mapService.getQuestionsForQuest(questId);
    }
}
