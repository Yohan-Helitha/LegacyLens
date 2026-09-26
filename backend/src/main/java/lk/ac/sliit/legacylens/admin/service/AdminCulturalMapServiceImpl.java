package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminBadgeRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminLandmarkRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminQuestRequest;
import lk.ac.sliit.legacylens.admin.entity.AuditActionType;
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
        private final AdminAuditService auditService;

        @Override
        public List<MapLandmarkResponse> getAllLandmarks() {
                return mapService.getAllLandmarks();
        }

        @Override
        public List<RegionResponse> getAllRegions() {
                return mapService.getAllRegions();
        }

        @Override
        public MapLandmarkResponse createLandmark(AdminLandmarkRequest request,
                        String performedById, String performedByName) {
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
                MapLandmarkResponse result = mapService.createLandmark(req);
                auditService.logAction(AuditActionType.CREATED, "Landmark",
                                result.getId() != null ? result.getId().toString() : null,
                                request.getName(), performedById, performedByName,
                                "New landmark created in region: " + request.getRegion());
                return result;
        }

        @Override
        public MapLandmarkResponse updateLandmark(Long id, AdminLandmarkRequest request,
                        String performedById, String performedByName) {
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
                MapLandmarkResponse result = mapService.updateLandmark(id, req);
                auditService.logAction(AuditActionType.UPDATED, "Landmark",
                                id.toString(), request.getName(), performedById, performedByName,
                                "Landmark details updated");
                return result;
        }

        @Override
        public void deleteLandmark(Long id, String performedById, String performedByName) {
                // Fetch name before deleting for the audit record
                String title = "Landmark #" + id;
                try {
                        MapLandmarkResponse existing = mapService.getAllLandmarks().stream()
                                        .filter(l -> id.equals(l.getId()))
                                        .findFirst().orElse(null);
                        if (existing != null)
                                title = existing.getName();
                } catch (Exception ignored) {
                }

                mapService.deleteLandmark(id);
                auditService.logAction(AuditActionType.DELETED, "Landmark",
                                id.toString(), title, performedById, performedByName,
                                "Landmark permanently removed");
        }

        @Override
        public String uploadBadgeImage(MultipartFile file) {
                return mapService.uploadBadgeImage(file);
        }

        @Override
        public String uploadModelFile(MultipartFile file) {
                return mapService.uploadModelFile(file);
        }

        @Override
        public BadgeResponse saveBadge(AdminBadgeRequest request,
                        String performedById, String performedByName) {
                SaveBadgeRequest req = SaveBadgeRequest.builder()
                                .landmarkId(request.getLandmarkId())
                                .landmarkCode(request.getLandmarkCode())
                                .badgeCode(request.getBadgeCode())
                                .title(request.getTitle())
                                .image(request.getImage())
                                .build();
                BadgeResponse result = mapService.saveBadge(req);
                auditService.logAction(AuditActionType.CREATED, "Badge",
                                result.getId() != null ? result.getId().toString() : null,
                                request.getTitle(), performedById, performedByName,
                                "Badge saved for landmark: " + request.getLandmarkCode());
                return result;
        }

        @Override
        public QuestResponse saveQuest(AdminQuestRequest request,
                        String performedById, String performedByName) {
                SaveQuestRequest req = SaveQuestRequest.builder()
                                .id(request.getId())
                                .landmarkId(request.getLandmarkId())
                                .landmarkCode(request.getLandmarkCode())
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .questions(request.getQuestions())
                                .build();
                QuestResponse result = mapService.saveQuest(req);
                AuditActionType actionType = request.getId() != null ? AuditActionType.UPDATED
                                : AuditActionType.CREATED;
                auditService.logAction(actionType, "Quest",
                                result.getId() != null ? result.getId().toString() : null,
                                request.getTitle(), performedById, performedByName,
                                "Quest saved for landmark: " + request.getLandmarkCode());
                return result;
        }

        @Override
        public void deleteQuest(Long id, String performedById, String performedByName) {
                mapService.deleteQuest(id);
                auditService.logAction(AuditActionType.DELETED, "Quest",
                                id.toString(), "Quest #" + id, performedById, performedByName,
                                "Quest permanently removed");
        }

        @Override
        public List<QuestionResponse> getQuestionsForQuest(Long questId) {
                return mapService.getQuestionsForQuest(questId);
        }
}
