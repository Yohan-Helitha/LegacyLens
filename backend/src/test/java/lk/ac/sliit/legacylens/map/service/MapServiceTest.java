package lk.ac.sliit.legacylens.map.service;

import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.common.storage.MediaStorageService;
import lk.ac.sliit.legacylens.map.dto.*;
import lk.ac.sliit.legacylens.map.entity.*;
import lk.ac.sliit.legacylens.map.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MapServiceTest {

    @Mock
    private LandmarkRepository landmarkRepository;

    @Mock
    private QuestRepository questRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private UserBadgeRepository userBadgeRepository;

    @Mock
    private BadgeRepository badgeRepository;

    @Mock
    private RegionRepository regionRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private MediaStorageService mediaStorageService;

    private MapService mapService;

    @BeforeEach
    void setUp() {
        mapService = new MapService(
                landmarkRepository,
                questRepository,
                questionRepository,
                userBadgeRepository,
                badgeRepository,
                regionRepository,
                fileStorageService,
                mediaStorageService
        );
    }

    @Test
    void getAllLandmarks_mapsLandmarksWithBadgesAndQuests() {
        Landmark landmark = new Landmark();
        landmark.setId(1L);
        landmark.setCode("sigiriya-rock");
        landmark.setName("Sigiriya Fortress");
        landmark.setDescription("Ancient rock palace and UNESCO World Heritage site");
        landmark.setLatitude(7.9570);
        landmark.setLongitude(80.7603);
        landmark.setType("Historical & Archaeological Sites");
        landmark.setRegion("Central Province");
        landmark.setDistrict("Matale");

        Badge badge = new Badge();
        badge.setBadgeCode("sigiriya-explorer");
        badge.setTitle("Sigiriya Conqueror");
        badge.setImage("badge-sigiriya.png");
        landmark.setBadge(badge);

        Quest quest = new Quest();
        quest.setId(10L);
        quest.setTitle("Sky Fortress Mystery");
        quest.setDescription("Answer riddles about King Kashyapa");
        landmark.getQuests().add(quest);

        when(landmarkRepository.findAll()).thenReturn(List.of(landmark));

        List<MapLandmarkResponse> result = mapService.getAllLandmarks();

        assertThat(result).hasSize(1);
        MapLandmarkResponse res = result.get(0);
        assertThat(res.getId()).isEqualTo("sigiriya-rock");
        assertThat(res.getName()).isEqualTo("Sigiriya Fortress");
        assertThat(res.getBadge()).isNotNull();
        assertThat(res.getBadge().getId()).isEqualTo("sigiriya-explorer");
        assertThat(res.getQuests()).hasSize(1);
        assertThat(res.getQuests().get(0).getTitle()).isEqualTo("Sky Fortress Mystery");
    }

    @Test
    void createLandmark_withExplicitCode_savesLandmark() {
        CreateLandmarkRequest request = new CreateLandmarkRequest();
        request.setCode("galle-fort");
        request.setName("Galle Dutch Fort");
        request.setDescription("16th century Portuguese & Dutch fortress");
        request.setLatitude(6.0328);
        request.setLongitude(80.2170);
        request.setRegion("Southern Province");
        request.setDistrict("Galle");

        Landmark saved = new Landmark();
        saved.setId(2L);
        saved.setCode("galle-fort");
        saved.setName("Galle Dutch Fort");

        when(landmarkRepository.save(any(Landmark.class))).thenReturn(saved);

        MapLandmarkResponse response = mapService.createLandmark(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("galle-fort");
        assertThat(response.getName()).isEqualTo("Galle Dutch Fort");
        verify(landmarkRepository).save(any(Landmark.class));
    }

    @Test
    void createLandmark_withoutCode_generatesSlugCode() {
        CreateLandmarkRequest request = new CreateLandmarkRequest();
        request.setName("Dambulla Cave Temple");
        request.setDescription("Cave temple complex");

        Landmark saved = new Landmark();
        saved.setId(3L);
        saved.setCode("dambulla-cave-temple-12345");
        saved.setName("Dambulla Cave Temple");

        when(landmarkRepository.save(any(Landmark.class))).thenReturn(saved);

        MapLandmarkResponse response = mapService.createLandmark(request);

        assertThat(response.getId()).startsWith("dambulla-cave-temple");
        ArgumentCaptor<Landmark> captor = ArgumentCaptor.forClass(Landmark.class);
        verify(landmarkRepository).save(captor.capture());
        assertThat(captor.getValue().getCode()).startsWith("dambulla-cave-temple-");
    }

    @Test
    void updateLandmark_existingLandmark_updatesFields() {
        Landmark existing = new Landmark();
        existing.setId(5L);
        existing.setCode("polonnaruwa-vatadage");
        existing.setName("Old Vatadage");

        when(landmarkRepository.findById(5L)).thenReturn(Optional.of(existing));

        CreateLandmarkRequest updateReq = new CreateLandmarkRequest();
        updateReq.setName("Polonnaruwa Vatadage");
        updateReq.setDescription("Circular relic house");
        updateReq.setRegion("North Central");

        when(landmarkRepository.save(existing)).thenReturn(existing);

        MapLandmarkResponse response = mapService.updateLandmark(5L, updateReq);

        assertThat(existing.getName()).isEqualTo("Polonnaruwa Vatadage");
        assertThat(existing.getDescription()).isEqualTo("Circular relic house");
        assertThat(existing.getRegion()).isEqualTo("North Central");
    }

    @Test
    void updateLandmark_notFound_throwsException() {
        when(landmarkRepository.findById(99L)).thenReturn(Optional.empty());

        CreateLandmarkRequest req = new CreateLandmarkRequest();
        req.setName("Unknown");

        assertThatThrownBy(() -> mapService.updateLandmark(99L, req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Landmark not found");
    }

    @Test
    void deleteLandmark_existing_deletesFromRepo() {
        when(landmarkRepository.existsById(12L)).thenReturn(true);

        mapService.deleteLandmark(12L);

        verify(landmarkRepository).deleteById(12L);
    }

    @Test
    void deleteLandmark_notFound_throwsException() {
        when(landmarkRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> mapService.deleteLandmark(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Landmark not found");
    }

    @Test
    void uploadBadgeImage_delegatesToFileStorageService() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "bytes".getBytes());
        when(fileStorageService.store(file, "badges")).thenReturn("badges/test-uuid.png");

        String result = mapService.uploadBadgeImage(file);

        assertThat(result).isEqualTo("badges/test-uuid.png");
    }

    @Test
    void uploadModelFile_delegatesToMediaStorageService() {
        MockMultipartFile file = new MockMultipartFile("file", "statue.glb", "model/gltf-binary", "bytes".getBytes());
        when(mediaStorageService.storeModelFile(file, "models")).thenReturn("models/statue-uuid.glb");

        String result = mapService.uploadModelFile(file);

        assertThat(result).isEqualTo("models/statue-uuid.glb");
    }

    @Test
    void saveBadge_attachesBadgeToLandmark() {
        Landmark landmark = new Landmark();
        landmark.setId(1L);
        landmark.setCode("sigiriya");

        when(landmarkRepository.findById(1L)).thenReturn(Optional.of(landmark));

        SaveBadgeRequest request = new SaveBadgeRequest();
        request.setLandmarkId(1L);
        request.setBadgeCode("badge-sigiriya");
        request.setTitle("Lion Rock Explorer");
        request.setImage("lion.png");

        Badge savedBadge = new Badge();
        savedBadge.setBadgeCode("badge-sigiriya");
        savedBadge.setTitle("Lion Rock Explorer");
        savedBadge.setImage("lion.png");

        when(badgeRepository.save(any(Badge.class))).thenReturn(savedBadge);

        BadgeResponse response = mapService.saveBadge(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("badge-sigiriya");
        assertThat(response.getTitle()).isEqualTo("Lion Rock Explorer");
        verify(badgeRepository).save(any(Badge.class));
    }

    @Test
    void saveQuest_createsQuestWithQuestionsAndChoices() {
        Landmark landmark = new Landmark();
        landmark.setId(10L);
        landmark.setCode("kandy-temple");

        when(landmarkRepository.findById(10L)).thenReturn(Optional.of(landmark));

        SaveQuestRequest request = new SaveQuestRequest();
        request.setLandmarkId(10L);
        request.setTitle("Temple of the Sacred Tooth Quest");
        request.setDescription("Complete the quiz about the sacred relic.");

        CreateQuestionRequest q1 = new CreateQuestionRequest();
        q1.setRiddle("In which century was the current temple palace constructed?");
        CreateChoiceRequest c1 = new CreateChoiceRequest();
        c1.setLabel("17th Century");
        c1.setCorrect(true);
        CreateChoiceRequest c2 = new CreateChoiceRequest();
        c2.setLabel("12th Century");
        c2.setCorrect(false);
        q1.setChoices(List.of(c1, c2));
        request.setQuestions(List.of(q1));

        Quest savedQuest = new Quest();
        savedQuest.setId(50L);
        savedQuest.setTitle("Temple of the Sacred Tooth Quest");
        savedQuest.setDescription("Complete the quiz about the sacred relic.");

        when(questRepository.save(any(Quest.class))).thenReturn(savedQuest);

        QuestResponse response = mapService.saveQuest(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(50L);
        assertThat(response.getTitle()).isEqualTo("Temple of the Sacred Tooth Quest");
        verify(questionRepository, atLeastOnce()).save(any(Question.class));
    }

    @Test
    void deleteQuest_deletesFromRepo() {
        when(questRepository.existsById(50L)).thenReturn(true);

        mapService.deleteQuest(50L);

        verify(questRepository).deleteById(50L);
    }

    @Test
    void getQuestionsForQuest_returnsQuestionsWithChoices() {
        Question q = new Question();
        q.setId(1L);
        q.setRiddle("Who was the king that fortified Sigiriya?");

        QuestionChoice c1 = new QuestionChoice();
        c1.setId(101L);
        c1.setLabel("King Kashyapa");
        c1.setCorrect(true);

        QuestionChoice c2 = new QuestionChoice();
        c2.setId(102L);
        c2.setLabel("King Dhatusena");
        c2.setCorrect(false);

        q.setChoices(List.of(c1, c2));

        when(questionRepository.findByQuestId(5L)).thenReturn(List.of(q));

        List<QuestionResponse> questions = mapService.getQuestionsForQuest(5L);

        assertThat(questions).hasSize(1);
        assertThat(questions.get(0).getRiddle()).isEqualTo("Who was the king that fortified Sigiriya?");
        assertThat(questions.get(0).getChoices()).hasSize(2);
        assertThat(questions.get(0).getChoices().get(0).getLabel()).isEqualTo("King Kashyapa");
        assertThat(questions.get(0).getChoices().get(0).isCorrect()).isTrue();
    }

    @Test
    void getAllBadges_returnsSortedBadges() {
        Badge b1 = new Badge();
        b1.setBadgeCode("b-1");
        b1.setTitle("Temple Master");
        b1.setImage("b1.png");

        Badge b2 = new Badge();
        b2.setBadgeCode("b-2");
        b2.setTitle("Ancient Ruin Explorer");
        b2.setImage("b2.png");

        when(badgeRepository.findAllByOrderByIdAsc()).thenReturn(List.of(b1, b2));

        List<BadgeResponse> badges = mapService.getAllBadges();

        assertThat(badges).hasSize(2);
        assertThat(badges.get(0).getId()).isEqualTo("b-1");
        assertThat(badges.get(1).getId()).isEqualTo("b-2");
    }

    @Test
    void getMyBadges_returnsUserUnlockedCodes() {
        UUID userId = UUID.randomUUID();

        Badge badge = new Badge();
        badge.setBadgeCode("sigiriya-badge");

        UserBadge ub = new UserBadge();
        ub.setBadge(badge);

        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of(ub));

        List<String> badgeCodes = mapService.getMyBadges(userId);

        assertThat(badgeCodes).containsExactly("sigiriya-badge");
    }

    @Test
    void unlockBadge_whenNotAlreadyUnlocked_savesUserBadge() {
        UUID userId = UUID.randomUUID();
        when(userBadgeRepository.findByUserId(userId)).thenReturn(new ArrayList<>());

        Badge badge = new Badge();
        badge.setBadgeCode("sigiriya-badge");
        when(badgeRepository.findByBadgeCode("sigiriya-badge")).thenReturn(Optional.of(badge));

        mapService.unlockBadge(userId, "sigiriya-badge");

        verify(userBadgeRepository).save(any(UserBadge.class));
    }

    @Test
    void unlockBadge_whenAlreadyUnlocked_doesNotSaveAgain() {
        UUID userId = UUID.randomUUID();
        Badge badge = new Badge();
        badge.setBadgeCode("sigiriya-badge");

        UserBadge ub = new UserBadge();
        ub.setBadge(badge);

        when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of(ub));

        mapService.unlockBadge(userId, "sigiriya-badge");

        verify(userBadgeRepository, never()).save(any(UserBadge.class));
    }

    @Test
    void getAllRegions_splitsDistrictsListProperly() {
        Region region = new Region();
        region.setId(1L);
        region.setCode("central");
        region.setLabel("Central Highlands");
        region.setRegionName("Central");
        region.setDescription("Misty hills and historical tea estates");
        region.setDistricts("Kandy, Matale, Nuwara Eliya");
        region.setLatitude(7.2906);
        region.setLongitude(80.6337);
        region.setZoom(10.0);

        when(regionRepository.findAllByOrderByIdAsc()).thenReturn(List.of(region));

        List<RegionResponse> regions = mapService.getAllRegions();

        assertThat(regions).hasSize(1);
        RegionResponse r = regions.get(0);
        assertThat(r.getCode()).isEqualTo("central");
        assertThat(r.getDistricts()).containsExactly("Kandy", "Matale", "Nuwara Eliya");
    }
}

