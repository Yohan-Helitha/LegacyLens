package lk.ac.sliit.legacylens.home.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.home.entity.AudioItem;
import lk.ac.sliit.legacylens.home.entity.BlogItem;
import lk.ac.sliit.legacylens.home.entity.VideoItem;
import lk.ac.sliit.legacylens.home.repository.FeedItemRepository;
import lk.ac.sliit.legacylens.tags.service.TagNormalizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Initializes community feed content including the 20 Home Page audio items from mockData.json.
 * Automatically resolves and registers all audio tags into the canonical tag system.
 */
@Slf4j
@Component
@Order(30)
@RequiredArgsConstructor
public class FeedItemDataInitializer implements CommandLineRunner {

    private final FeedItemRepository feedItemRepository;
    private final TagNormalizationService tagNormalizationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void run(String... args) {
        if (feedItemRepository.count() > 0) {
            log.info("[FeedItemDataInitializer] feed_items already seeded, count: {}", feedItemRepository.count());
            return;
        }

        try {
            InputStream is = new ClassPathResource("data/mockData.json").getInputStream();
            JsonNode root = objectMapper.readTree(is);

            // 1. Seed Audio Items (Home page content audios)
            JsonNode audioNodes = root.get("audio");
            if (audioNodes != null && audioNodes.isArray()) {
                for (JsonNode aNode : audioNodes) {
                    AudioItem ai = new AudioItem();
                    String name = aNode.hasNonNull("name") ? aNode.get("name").asText() : "Elder Storyteller";
                    String topic = aNode.hasNonNull("topic") ? aNode.get("topic").asText() : "Cultural Oral History";
                    ai.setTitle(topic);
                    ai.setAuthor(name);
                    ai.setLocation(aNode.hasNonNull("location") ? aNode.get("location").asText() : "Sri Lanka");
                    ai.setDuration(aNode.hasNonNull("duration") ? aNode.get("duration").asText() : "10 mins");
                    ai.setTopic(topic);
                    ai.setAvatar(aNode.hasNonNull("avatar") ? aNode.get("avatar").asText() : "https://i.pravatar.cc/150?img=1");
                    ai.setLikesCount(15);
                    ai.setCommentsCount(2);

                    List<Integer> bars = new ArrayList<>();
                    if (aNode.has("bars") && aNode.get("bars").isArray()) {
                        for (JsonNode b : aNode.get("bars")) {
                            bars.add(b.asInt());
                        }
                    }
                    if (bars.isEmpty()) {
                        bars = List.of(2, 4, 3, 5, 2, 6, 4, 2, 3, 5, 2);
                    }
                    ai.setBars(bars);

                    List<String> tags = new ArrayList<>();
                    if (aNode.has("tags") && aNode.get("tags").isArray()) {
                        for (JsonNode t : aNode.get("tags")) {
                            String tagStr = t.asText();
                            tags.add(tagStr);
                            // Register in canonical tag system
                            try {
                                tagNormalizationService.findOrCreateCanonicalTag(tagStr, "en", "Oral Tradition", "Oral history and audio heritage concept", true);
                            } catch (Exception ignored) {}
                        }
                    }
                    ai.setTags(tags);

                    feedItemRepository.save(ai);
                }
                log.info("[FeedItemDataInitializer] Seeded {} cultural AudioItems into feed_items", audioNodes.size());
            }

            // 2. Seed Videos
            JsonNode videoNodes = root.get("videos");
            if (videoNodes != null && videoNodes.isArray()) {
                for (JsonNode vNode : videoNodes) {
                    VideoItem vi = new VideoItem();
                    vi.setTitle(vNode.hasNonNull("title") ? vNode.get("title").asText() : "Cultural Video");
                    vi.setAuthor(vNode.hasNonNull("author") ? vNode.get("author").asText() : "Elder Custodian");
                    vi.setLocation(vNode.hasNonNull("location") ? vNode.get("location").asText() : "Sri Lanka");
                    vi.setThumbnail(vNode.hasNonNull("thumbnail") ? vNode.get("thumbnail").asText() : null);
                    String rawVUrl = vNode.hasNonNull("videoUrl") ? vNode.get("videoUrl").asText() : null;
                    vi.setVideoUrl(rawVUrl != null && !rawVUrl.isBlank() ? rawVUrl : null);
                    vi.setDuration(vNode.hasNonNull("duration") ? vNode.get("duration").asText() : "10:00");
                    vi.setLikesCount(20);
                    vi.setCommentsCount(4);

                    List<String> tags = new ArrayList<>();
                    if (vNode.has("tags") && vNode.get("tags").isArray()) {
                        for (JsonNode t : vNode.get("tags")) {
                            tags.add(t.asText());
                        }
                    }
                    vi.setTags(tags);
                    feedItemRepository.save(vi);
                }
            }

            // 3. Seed Blogs
            JsonNode blogNodes = root.get("blogs");
            if (blogNodes != null && blogNodes.isArray()) {
                for (JsonNode bNode : blogNodes) {
                    BlogItem bi = new BlogItem();
                    bi.setTitle(bNode.hasNonNull("title") ? bNode.get("title").asText() : "Cultural Article");
                    bi.setAuthor(bNode.hasNonNull("author") ? bNode.get("author").asText() : "Historian");
                    bi.setLocation("Sri Lanka");
                    bi.setThumbnail(bNode.hasNonNull("thumbnail") ? bNode.get("thumbnail").asText() : null);
                    bi.setExcerpt(bNode.hasNonNull("excerpt") ? bNode.get("excerpt").asText() : null);
                    bi.setReadTime(bNode.hasNonNull("readTime") ? bNode.get("readTime").asText() : "5 min");
                    bi.setLikesCount(18);
                    bi.setCommentsCount(3);

                    List<String> tags = new ArrayList<>();
                    if (bNode.has("tags") && bNode.get("tags").isArray()) {
                        for (JsonNode t : bNode.get("tags")) {
                            tags.add(t.asText());
                        }
                    }
                    bi.setTags(tags);
                    feedItemRepository.save(bi);
                }
            }

            log.info("[FeedItemDataInitializer] Successfully initialized feed_items database from mockData.json");
        } catch (Exception e) {
            log.error("[FeedItemDataInitializer] Failed to seed feed_items: {}", e.getMessage(), e);
        }
    }
}

