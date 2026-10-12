package lk.ac.sliit.legacylens.discovery.service;

import lk.ac.sliit.legacylens.discovery.dto.DiscoveryStoryResponse;
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

        // 1. Fetch all published stories
        List<ModerationQueueItem> publishedStories = moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED);
        if (publishedStories.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), 0);
        }

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

            scoredResults.add(DiscoveryStoryResponse.builder()
                    .id(story.getId())
                    .title(story.getTitle())
                    .description(story.getDescription())
                    .bodyContent(story.getBodyContent())
                    .imageUrl(story.getImageUrl())
                    .type(story.getType() != null ? story.getType() : story.getMethod())
                    .authorName(story.getAuthorName())
                    .district(story.getDistrict())
                    .region(story.getRegion())
                    .tags(tagNames)
                    .publishedAt(story.getPublishedAt() != null ? story.getPublishedAt().format(DATE_FORMATTER) : null)
                    .likesCount(story.getLikesCount() != null ? story.getLikesCount() : 0)
                    .commentsCount(story.getCommentsCount() != null ? story.getCommentsCount() : 0)
                    .score(score)
                    .matchReason(String.join(", ", matchReasons))
                    .build());
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
                    .commentsCount(candidate.getCommentsCount() != null ? candidate.getCommentsCount() : 0)
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
     * constructs weighted tag affinity profile, scores candidate stories, and diversifies recommendations.
     */
    @Transactional(readOnly = true)
    public List<DiscoveryStoryResponse> getPersonalizedRecommendations(UUID viewerId, int limit) {
        int maxResults = (limit > 0) ? limit : 10;
        List<ModerationQueueItem> publishedStories = moderationQueueRepository.findByStatus(StoryStatus.PUBLISHED);

        if (publishedStories.isEmpty()) {
            return Collections.emptyList();
        }

        // Pre-fetch tags for all published stories
        List<UUID> storyIds = publishedStories.stream().map(ModerationQueueItem::getId).toList();
        List<StoryTag> allStoryTags = storyTagRepository.findByStoryIdIn(storyIds);
        Map<UUID, List<Tag>> storyToTagsMap = new HashMap<>();
        for (StoryTag st : allStoryTags) {
            storyToTagsMap.computeIfAbsent(st.getStoryId(), k -> new ArrayList<>()).add(st.getTag());
        }

        // 1. If no authenticated user, return fallback feed sorted by engagement & freshness
        if (viewerId == null) {
            return buildFallbackFeed(publishedStories, storyToTagsMap, maxResults);
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
            return buildFallbackFeed(publishedStories, storyToTagsMap, maxResults);
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

            candidateResponses.add(DiscoveryStoryResponse.builder()
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
                    .commentsCount(candidate.getCommentsCount() != null ? candidate.getCommentsCount() : 0)
                    .score(homeScore)
                    .matchReason(matchReason)
                    .build());
        }

        // Sort by homeScore descending
        candidateResponses.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        // 6. Diversify recommendations (Section 11.6):
        // Avoid showing many consecutive stories with the same dominant primary tag or category
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

        return publishedStories.stream()
                .sorted((a, b) -> {
                    int likesA = a.getLikesCount() != null ? a.getLikesCount() : 0;
                    int likesB = b.getLikesCount() != null ? b.getLikesCount() : 0;
                    return Integer.compare(likesB, likesA);
                })
                .limit(maxResults)
                .map(s -> {
                    List<String> tagNames = storyToTagsMap.getOrDefault(s.getId(), Collections.emptyList())
                            .stream().map(Tag::getCanonicalName).toList();
                    if (tagNames.isEmpty() && s.getTags() != null) {
                        tagNames = Arrays.asList(s.getTags());
                    }

                    return DiscoveryStoryResponse.builder()
                            .id(s.getId())
                            .title(s.getTitle())
                            .description(s.getDescription())
                            .bodyContent(s.getBodyContent())
                            .imageUrl(s.getImageUrl())
                            .type(s.getType() != null ? s.getType() : s.getMethod())
                            .authorName(s.getAuthorName())
                            .district(s.getDistrict())
                            .region(s.getRegion())
                            .tags(tagNames)
                            .publishedAt(s.getPublishedAt() != null ? s.getPublishedAt().format(DATE_FORMATTER) : null)
                            .likesCount(s.getLikesCount() != null ? s.getLikesCount() : 0)
                            .commentsCount(s.getCommentsCount() != null ? s.getCommentsCount() : 0)
                            .score(1.0)
                            .matchReason("Featured Cultural Heritage")
                            .build();
                })
                .toList();
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
