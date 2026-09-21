package lk.ac.sliit.legacylens.map.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lk.ac.sliit.legacylens.map.dto.*;
import lk.ac.sliit.legacylens.map.entity.*;
import lk.ac.sliit.legacylens.map.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MapService {

    private final LandmarkRepository landmarkRepository;
    private final QuestRepository questRepository;
    private final QuestionRepository questionRepository;
    private final QuestionChoiceRepository questionChoiceRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeRepository badgeRepository;
    private final RegionRepository regionRepository;
    private final lk.ac.sliit.legacylens.common.storage.FileStorageService fileStorageService;

    @PostConstruct
    public void seedData() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource("data/mockData.json").getInputStream();
            JsonNode root = mapper.readTree(is);

            JsonNode regionsNode = root.get("culturalRegions");
            if (regionsNode != null && regionsNode.isArray()) {
                for (JsonNode rNode : regionsNode) {
                    String code = rNode.get("id").asText();
                    if (regionRepository.findByCode(code).isPresent()) {
                        continue;
                    }
                    Region r = new Region();
                    r.setCode(code);
                    r.setLabel(rNode.get("label").asText());
                    r.setRegionName(rNode.hasNonNull("regionName") ? rNode.get("regionName").asText() : null);
                    r.setDescription(rNode.hasNonNull("description") ? rNode.get("description").asText() : null);
                    r.setDistricts(rNode.hasNonNull("districts") ? rNode.get("districts").asText() : null);
                    r.setLongitude(rNode.hasNonNull("lng") ? rNode.get("lng").asDouble() : null);
                    r.setLatitude(rNode.hasNonNull("lat") ? rNode.get("lat").asDouble() : null);
                    r.setZoom(rNode.hasNonNull("zoom") ? rNode.get("zoom").asDouble() : null);
                    regionRepository.save(r);
                }
            }

            JsonNode locations = root.get("mapLocations");
            JsonNode stages = root.get("adventureStages");

            for (JsonNode locNode : locations) {
                String locId = locNode.get("id").asText();
                if (landmarkRepository.findByCode(locId).isPresent()) {
                    continue;
                }

                Landmark l = new Landmark();
                l.setCode(locId);
                l.setName(locNode.get("name").asText());
                l.setDescription(locNode.get("description").asText());
                l.setLongitude(locNode.get("lng").asDouble());
                l.setLatitude(locNode.get("lat").asDouble());
                l.setType(locNode.has("type") ? locNode.get("type").asText() : "Historical & Archaeological Sites");
                l.setRegion(locNode.has("region") ? locNode.get("region").asText() : null);

                landmarkRepository.save(l);
            }

            for (JsonNode stageNode : stages) {
                String locationMatch = stageNode.get("location").asText();
                Landmark landmark = landmarkRepository.findAll().stream()
                        .filter(l -> l.getName().contains(locationMatch)
                                || l.getCode().contains(locationMatch.toLowerCase()))
                        .findFirst().orElse(null);

                // Auto-create landmark if it's missing from mapLocations but present in
                // adventureStages
                if (landmark == null) {
                    landmark = new Landmark();
                    landmark.setCode(locationMatch.toLowerCase().replace(" ", "-"));
                    landmark.setName(locationMatch);
                    landmark.setDescription("Cultural landmark located in " + locationMatch);
                    landmark.setLongitude(stageNode.has("lng") ? stageNode.get("lng").asDouble() : 80.0);
                    landmark.setLatitude(stageNode.has("lat") ? stageNode.get("lat").asDouble() : 7.0);
                    landmark.setType("Historical & Archaeological Sites");
                    landmarkRepository.save(landmark);
                }

                if (landmark.getBadge() != null) {
                    continue;
                }

                Badge b = new Badge();
                b.setBadgeCode(stageNode.get("badgeId").asText());
                b.setTitle(stageNode.get("title").asText());
                b.setImage(stageNode.get("badgeImage").asText());
                b.setLandmark(landmark);
                landmark.setBadge(b);

                if (landmark.getQuests().isEmpty()) {
                    Quest q = new Quest();
                    q.setTitle(stageNode.get("title").asText());
                    q.setDescription("Earn the " + b.getTitle() + " badge.");
                    q.setLandmark(landmark);

                    landmark.getQuests().add(q);
                    landmarkRepository.save(landmark);

                    JsonNode questions = stageNode.get("questions");
                    for (JsonNode qNode : questions) {
                        Question question = new Question();
                        question.setRiddle(qNode.get("riddle").asText());
                        if (qNode.hasNonNull("image")) {
                            question.setImage(qNode.get("image").asText());
                        }
                        question.setQuest(q);

                        JsonNode choices = qNode.get("choices");
                        for (JsonNode cNode : choices) {
                            QuestionChoice choice = new QuestionChoice();
                            choice.setLabel(cNode.get("label").asText());
                            choice.setIcon(cNode.hasNonNull("icon") ? cNode.get("icon").asText() : null);
                            choice.setCorrect(cNode.get("isCorrect").asBoolean());
                            choice.setQuestion(question);
                            question.getChoices().add(choice);
                        }
                        questionRepository.save(question);
                    }
                } else {
                    landmarkRepository.save(landmark);
                }
            }
            log.info("Successfully seeded map database from mockData.json");
        } catch (Exception e) {
            log.error("Failed to seed map database", e);
        }
    }

    @Transactional(readOnly = true)
    public List<MapLandmarkResponse> getAllLandmarks() {
        return landmarkRepository.findAll().stream().map(this::mapToLandmarkResponse).collect(Collectors.toList());
    }

    public MapLandmarkResponse mapToLandmarkResponse(Landmark l) {
        BadgeResponse badge = null;
        if (l.getBadge() != null) {
            badge = BadgeResponse.builder()
                    .id(l.getBadge().getBadgeCode())
                    .title(l.getBadge().getTitle())
                    .image(l.getBadge().getImage())
                    .build();
        }

        List<QuestResponse> quests = l.getQuests().stream().map(q -> QuestResponse.builder()
                .id(q.getId())
                .title(q.getTitle())
                .description(q.getDescription())
                .build()).collect(Collectors.toList());

        return MapLandmarkResponse.builder()
                .dbId(l.getId())
                .id(l.getCode())
                .name(l.getName())
                .description(l.getDescription())
                .lng(l.getLongitude())
                .lat(l.getLatitude())
                .type(l.getType())
                .region(l.getRegion())
                .district(l.getDistrict())
                .badge(badge)
                .quests(quests)
                .build();
    }

    @Transactional
    public MapLandmarkResponse createLandmark(CreateLandmarkRequest request) {
        Landmark l = new Landmark();
        String code = request.getCode();
        if (code == null || code.isBlank()) {
            code = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + UUID.randomUUID().toString().substring(0, 5);
        }
        l.setCode(code);
        l.setName(request.getName());
        l.setDescription(request.getDescription());
        l.setLongitude(request.getLongitude() != null ? request.getLongitude() : 80.7718);
        l.setLatitude(request.getLatitude() != null ? request.getLatitude() : 7.8731);
        l.setType(request.getType() != null && !request.getType().isBlank() ? request.getType() : "Historical & Archaeological Sites");
        l.setRegion(request.getRegion());
        l.setDistrict(request.getDistrict());

        Landmark saved = landmarkRepository.save(l);
        log.info("Created landmark: {} ({}) in {} - {}", saved.getName(), saved.getCode(), saved.getRegion(), saved.getDistrict());
        return mapToLandmarkResponse(saved);
    }

    @Transactional
    public MapLandmarkResponse updateLandmark(Long id, CreateLandmarkRequest request) {
        Landmark l = landmarkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Landmark not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            l.setName(request.getName());
        }
        if (request.getCode() != null && !request.getCode().isBlank()) {
            l.setCode(request.getCode());
        }
        if (request.getDescription() != null) {
            l.setDescription(request.getDescription());
        }
        if (request.getLongitude() != null) {
            l.setLongitude(request.getLongitude());
        }
        if (request.getLatitude() != null) {
            l.setLatitude(request.getLatitude());
        }
        if (request.getType() != null) {
            l.setType(request.getType());
        }
        if (request.getRegion() != null) {
            l.setRegion(request.getRegion());
        }
        if (request.getDistrict() != null) {
            l.setDistrict(request.getDistrict());
        }

        Landmark saved = landmarkRepository.save(l);
        log.info("Updated landmark: {} ({})", saved.getName(), saved.getId());
        return mapToLandmarkResponse(saved);
    }

    @Transactional
    public void deleteLandmark(Long id) {
        if (!landmarkRepository.existsById(id)) {
            throw new RuntimeException("Landmark not found with id: " + id);
        }
        landmarkRepository.deleteById(id);
        log.info("Deleted landmark with id: {}", id);
    }

    @Transactional
    public String uploadBadgeImage(org.springframework.web.multipart.MultipartFile file) {
        return fileStorageService.store(file, "badges");
    }

    @Transactional
    public BadgeResponse saveBadge(SaveBadgeRequest request) {
        Landmark landmark = null;
        if (request.getLandmarkId() != null) {
            landmark = landmarkRepository.findById(request.getLandmarkId())
                    .orElse(null);
        }
        if (landmark == null && request.getLandmarkCode() != null) {
            landmark = landmarkRepository.findByCode(request.getLandmarkCode())
                    .orElse(null);
        }
        if (landmark == null) {
            throw new RuntimeException("Landmark not found for badge assignment");
        }

        Badge badge = landmark.getBadge();
        if (badge == null) {
            badge = new Badge();
            badge.setLandmark(landmark);
            landmark.setBadge(badge);
        }
        badge.setBadgeCode(request.getBadgeCode());
        badge.setTitle(request.getTitle());
        badge.setImage(request.getImage());

        Badge saved = badgeRepository.save(badge);
        return BadgeResponse.builder()
                .id(saved.getBadgeCode())
                .title(saved.getTitle())
                .image(saved.getImage())
                .build();
    }

    @Transactional
    public QuestResponse saveQuest(SaveQuestRequest request) {
        Landmark landmark = null;
        if (request.getLandmarkId() != null) {
            landmark = landmarkRepository.findById(request.getLandmarkId())
                    .orElse(null);
        }
        if (landmark == null && request.getLandmarkCode() != null) {
            landmark = landmarkRepository.findByCode(request.getLandmarkCode())
                    .orElse(null);
        }
        if (landmark == null) {
            throw new RuntimeException("Landmark not found for quest");
        }

        Quest quest = null;
        if (request.getId() != null) {
            quest = questRepository.findById(request.getId()).orElse(null);
        }
        if (quest == null) {
            quest = new Quest();
            quest.setLandmark(landmark);
            landmark.getQuests().add(quest);
        }
        quest.setTitle(request.getTitle());
        quest.setDescription(request.getDescription());
        Quest savedQuest = questRepository.save(quest);

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            // Remove existing questions for clean update
            List<Question> existing = questionRepository.findByQuestId(savedQuest.getId());
            questionRepository.deleteAll(existing);
            savedQuest.getQuestions().clear();

            for (CreateQuestionRequest qReq : request.getQuestions()) {
                Question question = new Question();
                question.setRiddle(qReq.getRiddle());
                question.setImage(qReq.getImage());
                question.setQuest(savedQuest);

                if (qReq.getChoices() != null) {
                    for (CreateChoiceRequest cReq : qReq.getChoices()) {
                        QuestionChoice choice = new QuestionChoice();
                        choice.setLabel(cReq.getLabel());
                        choice.setIcon(cReq.getIcon());
                        choice.setImage(cReq.getImage());
                        choice.setCorrect(cReq.isCorrect());
                        choice.setQuestion(question);
                        question.getChoices().add(choice);
                    }
                }
                questionRepository.save(question);
            }
        }

        return QuestResponse.builder()
                .id(savedQuest.getId())
                .title(savedQuest.getTitle())
                .description(savedQuest.getDescription())
                .build();
    }

    @Transactional
    public void deleteQuest(Long questId) {
        if (!questRepository.existsById(questId)) {
            throw new RuntimeException("Quest not found with id: " + questId);
        }
        questRepository.deleteById(questId);
        log.info("Deleted quest with id: {}", questId);
    }

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestionsForQuest(Long questId) {
        return questionRepository.findByQuestId(questId).stream().map(q -> {
            List<ChoiceResponse> choices = q.getChoices().stream().map(c -> ChoiceResponse.builder()
                    .id("c" + c.getId())
                    .label(c.getLabel())
                    .icon(c.getIcon())
                    .image(c.getImage())
                    .isCorrect(c.isCorrect())
                    .build()).collect(Collectors.toList());

            return QuestionResponse.builder()
                    .riddle(q.getRiddle())
                    .image(q.getImage())
                    .choices(choices)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BadgeResponse> getAllBadges() {
        return badgeRepository.findAllByOrderByIdAsc().stream()
                .map(b -> BadgeResponse.builder()
                        .id(b.getBadgeCode())
                        .title(b.getTitle())
                        .image(b.getImage())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getMyBadges(java.util.UUID userId) {
        return userBadgeRepository.findByUserId(userId).stream()
                .map(ub -> ub.getBadge().getBadgeCode())
                .collect(Collectors.toList());
    }

    @Transactional
    public void unlockBadge(java.util.UUID userId, String badgeCode) {
        boolean alreadyUnlocked = userBadgeRepository.findByUserId(userId).stream()
                .anyMatch(ub -> ub.getBadge().getBadgeCode().equals(badgeCode));
        if (alreadyUnlocked)
            return;

        lk.ac.sliit.legacylens.map.entity.Badge badge = badgeRepository.findByBadgeCode(badgeCode)
                .orElseThrow(() -> new RuntimeException("Badge not found"));

        lk.ac.sliit.legacylens.users.entity.User user = new lk.ac.sliit.legacylens.users.entity.User();
        user.setId(userId);

        lk.ac.sliit.legacylens.map.entity.UserBadge userBadge = new lk.ac.sliit.legacylens.map.entity.UserBadge();
        userBadge.setUser(user);
        userBadge.setBadge(badge);

        userBadgeRepository.save(userBadge);
    }

    @Transactional(readOnly = true)
    public List<RegionResponse> getAllRegions() {
        return regionRepository.findAllByOrderByIdAsc().stream()
                .map(r -> {
                    List<String> districtList = new ArrayList<>();
                    if (r.getDistricts() != null && !r.getDistricts().isBlank()) {
                        for (String d : r.getDistricts().split(",")) {
                            districtList.add(d.trim());
                        }
                    }
                    return RegionResponse.builder()
                            .id(r.getId())
                            .code(r.getCode())
                            .label(r.getLabel())
                            .regionName(r.getRegionName())
                            .description(r.getDescription())
                            .districts(districtList)
                            .districtsString(r.getDistricts())
                            .longitude(r.getLongitude())
                            .latitude(r.getLatitude())
                            .zoom(r.getZoom())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
