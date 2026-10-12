package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminBadgeRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminLandmarkRequest;
import lk.ac.sliit.legacylens.admin.dto.AdminQuestRequest;
import lk.ac.sliit.legacylens.map.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AdminCulturalMapService {
    List<MapLandmarkResponse> getAllLandmarks();

    List<RegionResponse> getAllRegions();

    MapLandmarkResponse createLandmark(AdminLandmarkRequest request,
            String performedById, String performedByName);

    MapLandmarkResponse updateLandmark(Long id, AdminLandmarkRequest request,
            String performedById, String performedByName);

    void deleteLandmark(Long id, String performedById, String performedByName);

    String uploadBadgeImage(MultipartFile file);

    BadgeResponse saveBadge(AdminBadgeRequest request,
            String performedById, String performedByName);

    QuestResponse saveQuest(AdminQuestRequest request,
            String performedById, String performedByName);

    void deleteQuest(Long id, String performedById, String performedByName);

    List<QuestionResponse> getQuestionsForQuest(Long questId);
}
