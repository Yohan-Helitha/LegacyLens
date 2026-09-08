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

    MapLandmarkResponse createLandmark(AdminLandmarkRequest request);

    MapLandmarkResponse updateLandmark(Long id, AdminLandmarkRequest request);

    void deleteLandmark(Long id);

    String uploadBadgeImage(MultipartFile file);

    BadgeResponse saveBadge(AdminBadgeRequest request);

    QuestResponse saveQuest(AdminQuestRequest request);

    void deleteQuest(Long id);

    List<QuestionResponse> getQuestionsForQuest(Long questId);
}
