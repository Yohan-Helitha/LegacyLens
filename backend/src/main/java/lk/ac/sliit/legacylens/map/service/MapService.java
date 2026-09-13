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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MapService {

    private final LandmarkRepository landmarkRepository;
    private final QuestRepository questRepository;
    private final QuestionRepository questionRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeRepository badgeRepository;

    @PostConstruct
    public void seedData() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource("data/mockData.json").getInputStream();
            JsonNode root = mapper.readTree(is);

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
                l.setIcon(locNode.has("icon") ? locNode.get("icon").asText() : null);
                l.setImage(locNode.has("image") ? locNode.get("image").asText() : null);
                l.setModelUrl(locNode.hasNonNull("modelUrl") ? locNode.get("modelUrl").asText() : null);
                l.setRegion(locNode.has("region") ? locNode.get("region").asText() : null);
                
                landmarkRepository.save(l);
            }

            for (JsonNode stageNode : stages) {
                String locationMatch = stageNode.get("location").asText();
                Landmark landmark = landmarkRepository.findAll().stream()
                        .filter(l -> l.getName().contains(locationMatch) || l.getCode().contains(locationMatch.toLowerCase()))
                        .findFirst().orElse(null);

                // Auto-create landmark if it's missing from mapLocations but present in adventureStages
                if (landmark == null) {
                    landmark = new Landmark();
                    landmark.setCode(locationMatch.toLowerCase().replace(" ", "-"));
                    landmark.setName(locationMatch);
                    landmark.setDescription("Cultural landmark located in " + locationMatch);
                    landmark.setLongitude(stageNode.has("lng") ? stageNode.get("lng").asDouble() : 80.0);
                    landmark.setLatitude(stageNode.has("lat") ? stageNode.get("lat").asDouble() : 7.0);
                    landmark.setIcon("📍");
                    landmark.setImage("https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=200&h=200&fit=crop");
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
        return landmarkRepository.findAll().stream().map(l -> {
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
                    .id(l.getCode())
                    .name(l.getName())
                    .description(l.getDescription())
                    .lng(l.getLongitude())
                    .lat(l.getLatitude())
                    .icon(l.getIcon())
                    .image(l.getImage())
                    .modelUrl(l.getModelUrl())
                    .region(l.getRegion())
                    .badge(badge)
                    .quests(quests)
                    .build();
        }).collect(Collectors.toList());
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
        if (alreadyUnlocked) return;

        lk.ac.sliit.legacylens.map.entity.Badge badge = badgeRepository.findByBadgeCode(badgeCode)
                .orElseThrow(() -> new RuntimeException("Badge not found"));

        lk.ac.sliit.legacylens.users.entity.User user = new lk.ac.sliit.legacylens.users.entity.User();
        user.setId(userId);

        lk.ac.sliit.legacylens.map.entity.UserBadge userBadge = new lk.ac.sliit.legacylens.map.entity.UserBadge();
        userBadge.setUser(user);
        userBadge.setBadge(badge);
        
        userBadgeRepository.save(userBadge);
    }
}
