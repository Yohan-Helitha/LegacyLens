package lk.ac.sliit.legacylens.discovery.service;

import lk.ac.sliit.legacylens.discovery.dto.DiscoveryStoryResponse;
import lk.ac.sliit.legacylens.home.entity.AudioItem;
import lk.ac.sliit.legacylens.home.entity.FeedItem;
import lk.ac.sliit.legacylens.home.repository.FeedItemRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.tags.entity.StoryTag;
import lk.ac.sliit.legacylens.tags.entity.Tag;
import lk.ac.sliit.legacylens.tags.entity.TagAlias;
import lk.ac.sliit.legacylens.tags.repository.StoryTagRepository;
import lk.ac.sliit.legacylens.tags.repository.TagAliasRepository;
import lk.ac.sliit.legacylens.tags.repository.TagRepository;
import lk.ac.sliit.legacylens.tags.service.TagNormalizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CulturalDiscoveryService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final double RECENCY_HALF_LIFE_HOURS = 72.0;

    private final ModerationQueueRepository moderationQueueRepository;
    private final StoryTagRepository storyTagRepository;
    private final TagRepository tagRepository;
    private final TagAliasRepository tagAliasRepository;
    private final TagNormalizationService tagNormalizationService;
    private final JdbcTemplate jdbcTemplate;
    private final FeedItemRepository feedItemRepository;
    private final lk.ac.sliit.legacylens.home.repository.FeedItemCommentRepository commentRepository;

    /**
     * Tag-aware cultural search and filtering.
     * Evaluates title, description, body content, canonical tags, aliases, and optionally related concepts.
     */
    @Transactional(readOnly = true)
    public Page<DiscoveryStoryResponse> searchPublishedStories(
            String query,
            List<String> filterTags,
            String category,
            String district,
            String region,
            boolean includeRelated,
            int page,
            int size) {
        return searchPublishedStories(query, filterTags, category, district, region, null, includeRelated, page, size);
    }

    /**
     * Tag-aware cultural search and filtering across stories and Home Page audio content.
     * Evaluates title, description, topic, canonical tags, aliases, and related concepts.
     */
    @Transactional(readOnly = true)
    public Page<DiscoveryStoryResponse> searchPublishedStories(
            String query,
            List<String> filterTags,
            String category,
            String district,
            String region,
            String type,
            boolean includeRelated,
            int page,
            int size) {

        // 1. Fetch all published stories
        List<ModerationQueueItem> publishedStories = moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED);

        // 2. Pre-fetch tags for all published stories in one batch
        List<UUID> storyIds = publishedStories.stream().map(ModerationQueueItem::getId).toList();
        List<StoryTag> allStoryTags = storyTagRepository.findByStoryIdIn(storyIds);
        Map<UUID, List<Tag>> storyToTagsMap = new HashMap<>();
        for (StoryTag st : allStoryTags) {
            storyToTagsMap.computeIfAbsent(st.getStoryId(), k -> new ArrayList<>()).add(st.getTag());
        }

        // 3. Resolve search query concepts & aliases
        String normQuery = (query != null && !query.isBlank()) ? tagNormalizationService.normalizeTagName(query) : "";
        Set<UUID> resolvedQueryTagIds = new HashSet<>();
        Set<UUID> resolvedRelatedTagIds = new HashSet<>();

        if (!normQuery.isBlank()) {
            // Find tags whose canonical name or alias matches the query
            Optional<Tag> exactTag = tagNormalizationService.resolveCanonicalTag(query);
            exactTag.ifPresent(t -> resolvedQueryTagIds.add(t.getId()));

            List<Tag> matchingTags = tagRepository.findAll().stream()
                    .filter(t -> t.getNormalizedName().contains(normQuery) || normQuery.contains(t.getNormalizedName()))
                    .toList();
            matchingTags.forEach(t -> resolvedQueryTagIds.add(t.getId()));

            List<TagAlias> matchingAliases = tagAliasRepository.findAll().stream()
                    .filter(a -> a.getNormalizedAlias().contains(normQuery) || normQuery.contains(a.getNormalizedAlias()))
                    .toList();
            matchingAliases.forEach(a -> resolvedQueryTagIds.add(a.getTag().getId()));

            // If includeRelated is enabled, expand to related tags
            if (includeRelated && !resolvedQueryTagIds.isEmpty()) {
                for (UUID qTagId : resolvedQueryTagIds) {
                    List<Tag> related = tagNormalizationService.getRelatedTags(qTagId);
                    related.forEach(r -> resolvedRelatedTagIds.add(r.getId()));
                }
            }
        }

        // 4. Resolve filter tags
        Set<UUID> resolvedFilterTagIds = new HashSet<>();
        if (filterTags != null && !filterTags.isEmpty()) {
            for (String ft : filterTags) {
                if (ft == null || ft.isBlank()) continue;
                tagNormalizationService.resolveCanonicalTag(ft).ifPresent(t -> {
                    resolvedFilterTagIds.add(t.getId());
                    if (includeRelated) {
                        tagNormalizationService.getRelatedTags(t.getId()).forEach(r -> resolvedFilterTagIds.add(r.getId()));
                    }
                });
            }
        }

        // 5. Score and filter candidates
        List<DiscoveryStoryResponse> scoredResults = new ArrayList<>();

        for (ModerationQueueItem story : publishedStories) {
            // Filter by media type if requested
            if (type != null && !type.isBlank() && !type.equalsIgnoreCase("all")) {
                boolean storyIsAudio = isAudio(story);
                if (type.equalsIgnoreCase("audio") && !storyIsAudio) {
                    continue;
                } else if (type.equalsIgnoreCase("video") && (story.getType() == null || !story.getType().equalsIgnoreCase("video"))) {
                    continue;
                } else if (type.equalsIgnoreCase("blog") && (storyIsAudio || "video".equalsIgnoreCase(story.getType()))) {
                    continue;
                }
            }

            // Filter by category, district, region if specified
            if (district != null && !district.isBlank() && !district.equalsIgnoreCase(story.getDistrict())) {
                continue;
            }
            if (region != null && !region.isBlank() && !region.equalsIgnoreCase(story.getRegion())) {
                continue;
            }

            List<Tag> storyTags = storyToTagsMap.getOrDefault(story.getId(), Collections.emptyList());
            Set<UUID> storyTagIdSet = storyTags.stream().map(Tag::getId).collect(Collectors.toSet());

            // If filter tags provided, must match at least one
            if (!resolvedFilterTagIds.isEmpty()) {
                boolean hasOverlap = storyTagIdSet.stream().anyMatch(resolvedFilterTagIds::contains);
                if (!hasOverlap) {
                    continue;
                }
            }

            // Calculate relevance score
            double score = 0.0;
            List<String> matchReasons = new ArrayList<>();

            String title = story.getTitle() != null ? story.getTitle() : "";
            String desc = story.getDescription() != null ? story.getDescription() : "";
            String body = story.getBodyContent() != null ? story.getBodyContent() : "";
            String normTitle = tagNormalizationService.normalizeTagName(title);
            if (normTitle == null) normTitle = "";

            if (!normQuery.isBlank()) {
                // Exact title match
                if (!normTitle.isBlank() && normTitle.equalsIgnoreCase(normQuery)) {
                    score += 15.0;
                    matchReasons.add("Exact Title Match");
                } else if (!normTitle.isBlank() && normTitle.contains(normQuery)) {
                    score += 8.0;
                    matchReasons.add("Title Match");
                }

                // Canonical tag match
                boolean hasDirectTagMatch = storyTagIdSet.stream().anyMatch(resolvedQueryTagIds::contains);
                if (hasDirectTagMatch) {
                    score += 10.0;
                    matchReasons.add("Topic Tag Match");
                }

                // Related tag match
                if (includeRelated) {
                    boolean hasRelatedTagMatch = storyTagIdSet.stream().anyMatch(resolvedRelatedTagIds::contains);
                    if (hasRelatedTagMatch) {
                        score += 5.0;
                        matchReasons.add("Related Cultural Topic");
                    }
                }

                // Description and body content match
                if (desc.toLowerCase().contains(normQuery)) {
                    score += 4.0;
                    matchReasons.add("Description Match");
                }
                if (body.toLowerCase().contains(normQuery)) {
                    score += 2.0;
                    matchReasons.add("Content Match");
                }

                // If query was non-empty and no match found, skip
                if (score == 0.0) {
                    continue;
                }
            } else {
                // Base score when browsing / filter only
                score = 1.0;
                if (!resolvedFilterTagIds.isEmpty()) {
                    score += 5.0;
                    matchReasons.add("Tag Filter");
                }
            }

            // Factor in freshness & popularity
            double viewsBonus = Math.min(2.0, (story.getLikesCount() != null ? story.getLikesCount() : 0) * 0.1);
            score += viewsBonus;

            List<String> tagNames = storyTags.stream().map(Tag::getCanonicalName).toList();
            if (tagNames.isEmpty() && story.getTags() != null) {
                tagNames = Arrays.asList(story.getTags());
            }

            scoredResults.add(mapStoryToDiscoveryResponse(story, tagNames, score, String.join(", ", matchReasons)));
        }

        // 6. Also score AudioItems from feed_items (Home page content audios)
        if (feedItemRepository != null && (type == null || type.isBlank() || "audio".equalsIgnoreCase(type) || "all".equalsIgnoreCase(type))) {
            List<FeedItem> allFeedItems = Collections.emptyList();
            try {
                allFeedItems = feedItemRepository.findAll();
            } catch (Exception e) {
                log.warn("[Discovery] Could not load feed_items for audio search: {}", e.getMessage());
            }

            for (FeedItem fi : allFeedItems) {
                if (!(fi instanceof AudioItem ai)) continue;

                if (district != null && !district.isBlank() && (ai.getLocation() == null || !ai.getLocation().toLowerCase().contains(district.toLowerCase()))) {
                    continue;
                }

                List<String> aiTags = ai.getTags() != null ? ai.getTags() : Collections.emptyList();
                Set<UUID> aiTagIds = new HashSet<>();
                for (String t : aiTags) {
                    tagNormalizationService.resolveCanonicalTag(t).ifPresent(ct -> aiTagIds.add(ct.getId()));
                }

                if (!resolvedFilterTagIds.isEmpty()) {
                    boolean hasOverlap = aiTagIds.stream().anyMatch(resolvedFilterTagIds::contains);
                    if (!hasOverlap) {
                        continue;
                    }
                }

                double score = 0.0;
                List<String> matchReasons = new ArrayList<>();
                String title = ai.getTitle() != null ? ai.getTitle() : "";
                String topic = ai.getTopic() != null ? ai.getTopic() : "";
                String normTitle = tagNormalizationService.normalizeTagName(title);

                if (!normQuery.isBlank()) {
                    if (!normTitle.isBlank() && normTitle.equalsIgnoreCase(normQuery)) {
                        score += 15.0;
                        matchReasons.add("Exact Audio Title Match");
                    } else if (!normTitle.isBlank() && normTitle.contains(normQuery)) {
                        score += 8.0;
                        matchReasons.add("Audio Title Match");
                    }

                    boolean hasDirectTagMatch = aiTagIds.stream().anyMatch(resolvedQueryTagIds::contains)
                            || aiTags.stream().anyMatch(t -> t.toLowerCase().contains(normQuery) || normQuery.contains(t.toLowerCase()));
                    if (hasDirectTagMatch) {
                        score += 10.0;
                        matchReasons.add("Topic Tag Match");
                    }

                    if (includeRelated && aiTagIds.stream().anyMatch(resolvedRelatedTagIds::contains)) {
                        score += 5.0;
                        matchReasons.add("Related Cultural Topic");
                    }

                    if (topic.toLowerCase().contains(normQuery)) {
                        score += 4.0;
                        matchReasons.add("Topic Content Match");
                    }

                    if (score == 0.0) {
                        continue;
                    }
                } else {
                    score = 1.0;
                    if (!resolvedFilterTagIds.isEmpty()) {
                        score += 5.0;
                        matchReasons.add("Tag Filter");
                    }
                }

                score += Math.min(2.0, (ai.getLikesCount() != null ? ai.getLikesCount() : 0) * 0.1);
                scoredResults.add(mapAudioItemToDiscovery(ai, score, matchReasons.isEmpty() ? "Audio Heritage" : String.join(", ", matchReasons)));
            }
        }

        // Sort descending by score, then recency
        scoredResults.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // Paging
        int fromIndex = Math.min(page * size, scoredResults.size());
        int toIndex = Math.min(fromIndex + size, scoredResults.size());
        List<DiscoveryStoryResponse> pageContent = scoredResults.subList(fromIndex, toIndex);

        return new PageImpl<>(pageContent, PageRequest.of(page, size), scoredResults.size());
    }

    /**
     * Recommendations for story detail pages:
     * Computes similarity using canonical tag overlap (Jaccard), related tag edges, and text/context similarity.
     */
    @Transactional(readOnly = true)
    public List<DiscoveryStoryResponse> getRelatedStories(UUID storyId, int limit) {
        int maxResults = (limit > 0) ? limit : 4;

        ModerationQueueItem currentStory = moderationQueueRepository.findById(storyId).orElse(null);
        if (currentStory == null) {
            return Collections.emptyList();
        }

        // 1. Get canonical tags of current story
        List<Tag> currentTags = storyTagRepository.findTagsByStoryId(storyId);
        Set<UUID> currentTagIds = currentTags.stream().map(Tag::getId).collect(Collectors.toSet());

        // 2. Get related tags
        Set<UUID> relatedTagIds = new HashSet<>();
        for (Tag t : currentTags) {
            tagNormalizationService.getRelatedTags(t.getId()).forEach(r -> relatedTagIds.add(r.getId()));
        }
        // Remove current tags from related set
        relatedTagIds.removeAll(currentTagIds);

        // 3. Candidate published stories (excluding current)
        List<ModerationQueueItem> candidates = moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED).stream()
                .filter(s -> !s.getId().equals(storyId))
                .toList();

        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        // Pre-fetch tags for candidates
        List<UUID> candidateIds = candidates.stream().map(ModerationQueueItem::getId).toList();
        List<StoryTag> candidateStoryTags = storyTagRepository.findByStoryIdIn(candidateIds);
        Map<UUID, List<Tag>> candidateTagsMap = new HashMap<>();
        for (StoryTag st : candidateStoryTags) {
            candidateTagsMap.computeIfAbsent(st.getStoryId(), k -> new ArrayList<>()).add(st.getTag());
        }

        List<DiscoveryStoryResponse> scoredCandidates = new ArrayList<>();

        for (ModerationQueueItem candidate : candidates) {
            List<Tag> candTags = candidateTagsMap.getOrDefault(candidate.getId(), Collections.emptyList());
            Set<UUID> candTagIds = candTags.stream().map(Tag::getId).collect(Collectors.toSet());

            // A. Jaccard Canonical Tag Overlap
            double jaccard = 0.0;
            if (!currentTagIds.isEmpty() || !candTagIds.isEmpty()) {
                Set<UUID> intersection = new HashSet<>(currentTagIds);
                intersection.retainAll(candTagIds);

                Set<UUID> union = new HashSet<>(currentTagIds);
                union.addAll(candTagIds);

                jaccard = union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
            }

            // B. Related Tag Similarity
            double relatedSim = 0.0;
            if (!relatedTagIds.isEmpty() && !candTagIds.isEmpty()) {
                Set<UUID> relIntersection = new HashSet<>(relatedTagIds);
                relIntersection.retainAll(candTagIds);
                relatedSim = (double) relIntersection.size() / Math.max(1, relatedTagIds.size());
            }

            // C. Text Similarity
            double textSim = computeTextSimilarity(
                    (currentStory.getTitle() + " " + currentStory.getDescription()),
                    (candidate.getTitle() + " " + candidate.getDescription())
            );

            // D. Context Similarity (district or region match)
            double contextSim = 0.0;
            if (currentStory.getDistrict() != null && currentStory.getDistrict().equalsIgnoreCase(candidate.getDistrict())) {
                contextSim += 0.5;
            }
            if (currentStory.getRegion() != null && currentStory.getRegion().equalsIgnoreCase(candidate.getRegion())) {
                contextSim += 0.5;
            }

            // Weighted formula from Section 10.2:
            // score = 0.40 * canonicalTagSimilarity + 0.25 * relatedTagSimilarity + 0.25 * textSimilarity + 0.10 * contextSimilarity
            double finalScore = 0.40 * jaccard + 0.25 * relatedSim + 0.25 * textSim + 0.10 * contextSim;

            String matchReason = (jaccard > 0) ? "Shared Cultural Topics"
                    : (relatedSim > 0 ? "Related Heritage Tradition" : "Similar Regional Context");

            List<String> tagNames = candTags.stream().map(Tag::getCanonicalName).toList();
            if (tagNames.isEmpty() && candidate.getTags() != null) {
                tagNames = Arrays.asList(candidate.getTags());
            }

            scoredCandidates.add(DiscoveryStoryResponse.builder()
                    .id(candidate.getId())
                    .title(candidate.getTitle())
                    .description(candidate.getDescription())
                    .bodyContent(candidate.getBodyContent())
                    .imageUrl(candidate.getImageUrl())
                    .type(candidate.getType() != null ? candidate.getType() : candidate.getMethod())
                    .authorName(candidate.getAuthorName())
                    .district(candidate.getDistrict())
                    .region(candidate.getRegion())
                    .tags(tagNames)
                    .publishedAt(candidate.getPublishedAt() != null ? candidate.getPublishedAt().format(DATE_FORMATTER) : null)
                    .likesCount(candidate.getLikesCount() != null ? candidate.getLikesCount() : 0)
                    .commentsCount((int) Math.max(
                            candidate.getId() != null ? commentRepository.countByStoryId(candidate.getId()) : 0,
                            candidate.getCommentsCount() != null ? candidate.getCommentsCount() : 0))
                    .score(finalScore)
                    .matchReason(matchReason)
                    .build());
        }

        // Sort descending by score
        scoredCandidates.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        return scoredCandidates.stream().limit(maxResults).toList();
    }

    /**
     * Personalized Home recommendations based on recent viewing history in story_views.
     * Uses recency decay: recencyWeight = exp(-ln(2) * ageHours / halfLifeHours),
     * constructs weighted tag affinity profile, scores candidate stories & audios, and diversifies recommendations.
     */
    @Transactional(readOnly = true)
    public List<DiscoveryStoryResponse> getPersonalizedRecommendations(UUID viewerId, int limit) {
        return getPersonalizedRecommendations(viewerId, null, limit);
    }

    /**
     * Personalized Home recommendations with optional media type filter (e.g. "audio" for Home Audio tab).
     */
    @Transactional(readOnly = true)
    public List<DiscoveryStoryResponse> getPersonalizedRecommendations(UUID viewerId, String type, int limit) {
        int maxResults = (limit > 0) ? limit : 10;
        List<ModerationQueueItem> publishedStories = moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED);

        // Pre-fetch tags for all published stories
        List<UUID> storyIds = publishedStories.stream().map(ModerationQueueItem::getId).toList();
        List<StoryTag> allStoryTags = storyTagRepository.findByStoryIdIn(storyIds);
        Map<UUID, List<Tag>> storyToTagsMap = new HashMap<>();
        for (StoryTag st : allStoryTags) {
            storyToTagsMap.computeIfAbsent(st.getStoryId(), k -> new ArrayList<>()).add(st.getTag());
        }

        // 1. If no authenticated user, return fallback feed sorted by engagement & freshness
        if (viewerId == null) {
            return buildFallbackFeed(publishedStories, storyToTagsMap, type, maxResults);
        }

        // 2. Retrieve recent story views for this viewer
        List<Map<String, Object>> recentViews;
        try {
            recentViews = jdbcTemplate.queryForList(
                    "SELECT story_id, viewed_at FROM story_views " +
                    "WHERE viewer_id = ? ORDER BY viewed_at DESC LIMIT 30",
                    viewerId);
        } catch (Exception e) {
            log.warn("[Discovery] Error querying story_views: {}", e.getMessage());
            recentViews = Collections.emptyList();
        }

        if (recentViews.isEmpty()) {
            return buildFallbackFeed(publishedStories, storyToTagsMap, type, maxResults);
        }

        // 3. Deduplicate story IDs, retaining most recent view of each story
        Map<UUID, LocalDateTime> deduplicatedViews = new LinkedHashMap<>();
        for (Map<String, Object> row : recentViews) {
            UUID sid = (UUID) row.get("story_id");
            LocalDateTime viewedAt;
            Object vtObj = row.get("viewed_at");
            if (vtObj instanceof java.sql.Timestamp ts) {
                viewedAt = ts.toLocalDateTime();
            } else if (vtObj instanceof LocalDateTime ldt) {
                viewedAt = ldt;
            } else {
                viewedAt = LocalDateTime.now();
            }
            deduplicatedViews.putIfAbsent(sid, viewedAt);
        }

        // 4. Build weighted user interest profile with recency decay
        LocalDateTime now = LocalDateTime.now();
        Map<UUID, Double> tagAffinities = new HashMap<>();
        Map<UUID, Double> relatedAffinities = new HashMap<>();
        Set<UUID> recentlyViewedIds = new HashSet<>();

        for (Map.Entry<UUID, LocalDateTime> entry : deduplicatedViews.entrySet()) {
            UUID sId = entry.getKey();
            LocalDateTime vAt = entry.getValue();

            long hoursAgo = Math.max(0, Duration.between(vAt, now).toHours());
            // Filter out stories viewed in the last 12 hours from candidate pool (Section 11.3)
            if (hoursAgo < 12) {
                recentlyViewedIds.add(sId);
            }

            // recencyWeight = exp(-ln(2) * ageHours / halfLifeHours)
            double recencyWeight = Math.exp(-0.69314718056 * (double) hoursAgo / RECENCY_HALF_LIFE_HOURS);

            List<Tag> viewedStoryTags = storyToTagsMap.getOrDefault(sId, Collections.emptyList());
            for (Tag tag : viewedStoryTags) {
                tagAffinities.merge(tag.getId(), recencyWeight, Double::sum);

                // Related tags get partial affinity
                List<Tag> related = tagNormalizationService.getRelatedTags(tag.getId());
                for (Tag rTag : related) {
                    relatedAffinities.merge(rTag.getId(), recencyWeight * 0.4, Double::sum);
                }
            }
        }

        // Normalize / cap affinity scores so repeated views cannot dominate indefinitely (Section 11.2)
        tagAffinities.replaceAll((k, v) -> Math.min(5.0, v));
        relatedAffinities.replaceAll((k, v) -> Math.min(3.0, v));

        // 5. Score candidates
        List<DiscoveryStoryResponse> candidateResponses = new ArrayList<>();

        for (ModerationQueueItem candidate : publishedStories) {
            // Type filter
            if (type != null && !type.isBlank() && !type.equalsIgnoreCase("all")) {
                boolean isStoryAudio = isAudio(candidate);
                if (type.equalsIgnoreCase("audio") && !isStoryAudio) {
                    continue;
                } else if (type.equalsIgnoreCase("video") && (candidate.getType() == null || !candidate.getType().equalsIgnoreCase("video"))) {
                    continue;
                } else if (type.equalsIgnoreCase("blog") && (isStoryAudio || "video".equalsIgnoreCase(candidate.getType()))) {
                    continue;
                }
            }

            // Exclude stories viewed in the last 12 hours, unless candidate pool is very small
            if (publishedStories.size() > maxResults && recentlyViewedIds.contains(candidate.getId())) {
                continue;
            }

            List<Tag> candTags = storyToTagsMap.getOrDefault(candidate.getId(), Collections.emptyList());

            // User Tag Affinity
            double userTagScore = 0.0;
            double relatedTagScore = 0.0;
            List<String> matchedConcepts = new ArrayList<>();

            for (Tag t : candTags) {
                if (tagAffinities.containsKey(t.getId())) {
                    userTagScore += tagAffinities.get(t.getId());
                    matchedConcepts.add(t.getCanonicalName());
                } else if (relatedAffinities.containsKey(t.getId())) {
                    relatedTagScore += relatedAffinities.get(t.getId());
                    matchedConcepts.add("Related to " + t.getCanonicalName());
                }
            }

            // Normalization
            double normTagAffinity = Math.min(1.0, userTagScore / 3.0);
            double normRelatedAffinity = Math.min(1.0, relatedTagScore / 2.0);

            // Freshness score (stories published recently)
            double freshness = 0.5;
            if (candidate.getPublishedAt() != null) {
                long daysOld = Math.max(0, Duration.between(candidate.getPublishedAt(), now).toDays());
                freshness = Math.exp(-0.1 * daysOld);
            }

            // Engagement score (likes & comments)
            double engagement = Math.min(1.0, ((candidate.getLikesCount() != null ? candidate.getLikesCount() : 0) * 0.05));

            // Section 11.4: homeScore = 0.45 * userTagAffinity + 0.25 * relatedTagAffinity + 0.20 * engagement + 0.10 * freshness
            double homeScore = 0.45 * normTagAffinity + 0.25 * normRelatedAffinity + 0.20 * engagement + 0.10 * freshness;

            String matchReason = matchedConcepts.isEmpty() ? "Curated Cultural Discovery"
                    : "Based on your interest in " + String.join(", ", matchedConcepts.stream().limit(2).toList());

            List<String> tagNames = candTags.stream().map(Tag::getCanonicalName).toList();
            if (tagNames.isEmpty() && candidate.getTags() != null) {
                tagNames = Arrays.asList(candidate.getTags());
            }

            candidateResponses.add(mapStoryToDiscoveryResponse(candidate, tagNames, homeScore, matchReason));
        }

        // 6. Also score AudioItems from feed_items (Home page content audios) against tag affinities
        if (feedItemRepository != null && (type == null || type.isBlank() || "audio".equalsIgnoreCase(type) || "all".equalsIgnoreCase(type))) {
            List<FeedItem> allFeedItems = Collections.emptyList();
            try {
                allFeedItems = feedItemRepository.findAll();
            } catch (Exception e) {
                log.warn("[Discovery] Could not load feed_items for recommendations: {}", e.getMessage());
            }

            for (FeedItem fi : allFeedItems) {
                if (!(fi instanceof AudioItem ai)) continue;

                List<String> aiTags = ai.getTags() != null ? ai.getTags() : Collections.emptyList();
                double userTagScore = 0.0;
                double relatedTagScore = 0.0;
                List<String> matchedConcepts = new ArrayList<>();

                for (String t : aiTags) {
                    Optional<Tag> resolved = tagNormalizationService.resolveCanonicalTag(t);
                    if (resolved.isPresent()) {
                        UUID tid = resolved.get().getId();
                        if (tagAffinities.containsKey(tid)) {
                            userTagScore += tagAffinities.get(tid);
                            matchedConcepts.add(resolved.get().getCanonicalName());
                        } else if (relatedAffinities.containsKey(tid)) {
                            relatedTagScore += relatedAffinities.get(tid);
                            matchedConcepts.add("Related to " + resolved.get().getCanonicalName());
                        }
                    }
                }

                double normTagAffinity = Math.min(1.0, userTagScore / 3.0);
                double normRelatedAffinity = Math.min(1.0, relatedTagScore / 2.0);
                double engagement = Math.min(1.0, ((ai.getLikesCount() != null ? ai.getLikesCount() : 0) * 0.05));
                double homeScore = 0.45 * normTagAffinity + 0.25 * normRelatedAffinity + 0.20 * engagement + 0.10 * 0.8;

                String matchReason = matchedConcepts.isEmpty() ? "Featured Cultural Audio"
                        : "Recommended for you: " + String.join(", ", matchedConcepts.stream().limit(2).toList());

                candidateResponses.add(mapAudioItemToDiscovery(ai, homeScore, matchReason));
            }
        }

        // Sort by homeScore descending
        candidateResponses.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // 7. Diversify recommendations (Section 11.6):
        List<DiscoveryStoryResponse> diversified = diversifyResults(candidateResponses, maxResults);

        return diversified;
    }

    private List<DiscoveryStoryResponse> diversifyResults(List<DiscoveryStoryResponse> ranked, int maxLimit) {
        if (ranked.size() <= maxLimit) {
            return ranked;
        }

        List<DiscoveryStoryResponse> result = new ArrayList<>();
        Set<UUID> pickedIds = new HashSet<>();
        String lastPrimaryTag = null;

        for (DiscoveryStoryResponse story : ranked) {
            if (result.size() >= maxLimit) break;

            String primaryTag = story.getTags().isEmpty() ? "general" : story.getTags().get(0);
            if (lastPrimaryTag != null && lastPrimaryTag.equalsIgnoreCase(primaryTag) && ranked.size() > maxLimit * 2) {
                // Skip consecutive duplicate dominant tag if we have plenty of alternatives
                continue;
            }

            result.add(story);
            pickedIds.add(story.getId());
            lastPrimaryTag = primaryTag;
        }

        // Fill up to maxLimit if diversification was too strict
        if (result.size() < maxLimit) {
            for (DiscoveryStoryResponse story : ranked) {
                if (result.size() >= maxLimit) break;
                if (!pickedIds.contains(story.getId())) {
                    result.add(story);
                    pickedIds.add(story.getId());
                }
            }
        }

        return result;
    }

    private List<DiscoveryStoryResponse> buildFallbackFeed(
            List<ModerationQueueItem> publishedStories,
            Map<UUID, List<Tag>> storyToTagsMap,
            int maxResults) {
        return buildFallbackFeed(publishedStories, storyToTagsMap, null, maxResults);
    }

    private List<DiscoveryStoryResponse> buildFallbackFeed(
            List<ModerationQueueItem> publishedStories,
            Map<UUID, List<Tag>> storyToTagsMap,
            String type,
            int maxResults) {

        List<DiscoveryStoryResponse> results = new ArrayList<>();

        for (ModerationQueueItem s : publishedStories) {
            if (type != null && !type.isBlank() && !type.equalsIgnoreCase("all")) {
                boolean storyIsAudio = isAudio(s);
                if (type.equalsIgnoreCase("audio") && !storyIsAudio) {
                    continue;
                } else if (type.equalsIgnoreCase("video") && (s.getType() == null || !s.getType().equalsIgnoreCase("video"))) {
                    continue;
                } else if (type.equalsIgnoreCase("blog") && (storyIsAudio || "video".equalsIgnoreCase(s.getType()))) {
                    continue;
                }
            }

            List<String> tagNames = storyToTagsMap.getOrDefault(s.getId(), Collections.emptyList())
                    .stream().map(Tag::getCanonicalName).toList();
            if (tagNames.isEmpty() && s.getTags() != null) {
                tagNames = Arrays.asList(s.getTags());
            }

            results.add(mapStoryToDiscoveryResponse(s, tagNames, 1.0, "Featured Cultural Heritage"));
        }

        // Add AudioItems if type is audio or not filtered
        if (feedItemRepository != null && (type == null || type.isBlank() || "audio".equalsIgnoreCase(type) || "all".equalsIgnoreCase(type))) {
            try {
                List<FeedItem> allFeed = feedItemRepository.findAll();
                for (FeedItem fi : allFeed) {
                    if (fi instanceof AudioItem ai) {
                        results.add(mapAudioItemToDiscovery(ai, 1.0, "Featured Cultural Audio"));
                    }
                }
            } catch (Exception e) {
                log.warn("[Discovery] Could not load fallback AudioItems: {}", e.getMessage());
            }
        }

        return results.stream()
                .sorted((a, b) -> Integer.compare(b.getLikesCount(), a.getLikesCount()))
                .limit(maxResults)
                .toList();
    }

    private boolean isAudio(ModerationQueueItem story) {
        if (story == null) return false;
        String t = story.getType();
        String m = story.getMethod();
        return (t != null && t.equalsIgnoreCase("audio")) ||
               (m != null && m.equalsIgnoreCase("recorded") && (t == null || !t.equalsIgnoreCase("video")));
    }

    private DiscoveryStoryResponse mapStoryToDiscoveryResponse(ModerationQueueItem story, List<String> tagNames, double score, String matchReason) {
        boolean audio = isAudio(story);
        String typeStr = audio ? "audio" : (story.getType() != null ? story.getType() : story.getMethod());
        String durationStr = audio ? (story.getMediaDurationMillis() != null && story.getMediaDurationMillis() > 0 ? (story.getMediaDurationMillis() / 60000 + " mins") : "12 mins") : null;
        List<Integer> bars = audio ? List.of(2, 4, 3, 5, 2, 6, 4, 2, 3, 5, 2) : Collections.emptyList();

        return DiscoveryStoryResponse.builder()
                .id(story.getId())
                .title(story.getTitle())
                .description(story.getDescription())
                .bodyContent(story.getBodyContent())
                .imageUrl(story.getImageUrl())
                .type(typeStr != null ? typeStr.toLowerCase() : "blog")
                .authorName(story.getAuthorName())
                .district(story.getDistrict())
                .region(story.getRegion())
                .tags(tagNames)
                .publishedAt(story.getPublishedAt() != null ? story.getPublishedAt().format(DATE_FORMATTER) : null)
                .likesCount(story.getLikesCount() != null ? story.getLikesCount() : 0)
                .commentsCount((int) Math.max(
                        story.getId() != null ? commentRepository.countByStoryId(story.getId()) : 0,
                        story.getCommentsCount() != null ? story.getCommentsCount() : 0))
                .score(score)
                .matchReason(matchReason)
                .duration(durationStr)
                .topic(story.getDescription() != null && !story.getDescription().isBlank() ? story.getDescription() : story.getTitle())
                .mediaUrl(story.getMediaFilePath())
                .audioBars(bars)
                .build();
    }

    private DiscoveryStoryResponse mapAudioItemToDiscovery(AudioItem ai, double score, String matchReason) {
        UUID stableId = UUID.nameUUIDFromBytes(("feed_item_" + ai.getId()).getBytes());
        List<String> tags = ai.getTags() != null ? ai.getTags() : Collections.emptyList();
        return DiscoveryStoryResponse.builder()
                .id(stableId)
                .title(ai.getTitle())
                .description(ai.getTopic() != null ? ai.getTopic() : ai.getTitle())
                .bodyContent(ai.getTopic() != null ? ai.getTopic() : ai.getTitle())
                .imageUrl(ai.getAvatar() != null && !ai.getAvatar().isBlank() ? ai.getAvatar() : "https://i.pravatar.cc/150?img=1")
                .type("audio")
                .authorName(ai.getAuthor() != null ? ai.getAuthor() : "Elder Storyteller")
                .district(ai.getLocation())
                .region(ai.getLocation())
                .tags(tags)
                .publishedAt("2026-04-12 10:00")
                .likesCount(ai.getLikesCount() != null ? ai.getLikesCount() : 0)
                .commentsCount((int) Math.max(
                        ai.getId() != null ? commentRepository.countByFeedItemId(ai.getId()) : 0,
                        ai.getCommentsCount() != null ? ai.getCommentsCount() : 0))
                .score(score)
                .matchReason(matchReason)
                .duration(ai.getDuration() != null ? ai.getDuration() : "10 mins")
                .topic(ai.getTopic() != null ? ai.getTopic() : ai.getTitle())
                .audioBars(ai.getBars() != null && !ai.getBars().isEmpty() ? ai.getBars() : List.of(2, 4, 3, 5, 2, 6, 4, 2, 3, 5, 2))
                .build();
    }

    private double computeTextSimilarity(String textA, String textB) {
        if (textA == null || textB == null) return 0.0;
        Set<String> wordsA = tokenize(textA);
        Set<String> wordsB = tokenize(textB);
        if (wordsA.isEmpty() || wordsB.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(wordsA);
        intersection.retainAll(wordsB);

        Set<String> union = new HashSet<>(wordsA);
        union.addAll(wordsB);

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private Set<String> tokenize(String text) {
        String[] tokens = text.toLowerCase().split("[^\\p{L}\\p{N}]+");
        Set<String> stopWords = Set.of("the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "is", "was");
        Set<String> result = new HashSet<>();
        for (String t : tokens) {
            if (t.length() > 2 && !stopWords.contains(t)) {
                result.add(t);
            }
        }
        return result;
    }
}
