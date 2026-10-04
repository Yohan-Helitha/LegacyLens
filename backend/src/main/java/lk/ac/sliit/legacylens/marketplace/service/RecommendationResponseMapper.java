package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.RecommendationOpportunitySummaryResponse;
import lk.ac.sliit.legacylens.marketplace.dto.RecommendedCreatorResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

/** Shapes scored matches and opportunities into what the recommendations screen shows. */
@Component
public class RecommendationResponseMapper {

    public RecommendedCreatorResponse toResponse(Match match) {
        return baseResponse(match.candidate())
                .matchPercentage(match.percentage())
                .reasons(match.reasons())
                .build();
    }

    /** A creator shown without a score (a chosen creator who no longer ranks) — no made-up percentage or reasons. */
    public RecommendedCreatorResponse toUnscoredResponse(CreatorCandidate candidate) {
        return baseResponse(candidate).matchPercentage(null).reasons(List.of()).build();
    }

    private RecommendedCreatorResponse.RecommendedCreatorResponseBuilder baseResponse(CreatorCandidate candidate) {
        User user = candidate.user();
        List<String> skills = candidate.skills();
        return RecommendedCreatorResponse.builder()
                .creatorId(user.getId())
                .name(user.getFullName())
                .avatarUrl(user.getProfilePhotoUrl())
                .rating(candidate.rating())
                .completedJobs(candidate.completedJobs())
                .specialty(skills.isEmpty() ? null : skills.get(0))
                .languages(candidate.languages())
                .about(candidate.about());
    }

    public RecommendationOpportunitySummaryResponse toSummary(Opportunity opportunity) {
        return RecommendationOpportunitySummaryResponse.builder()
                .opportunityId(opportunity.getId())
                .title(opportunity.getTitle())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .category(opportunity.getCategory())
                .location(opportunity.getLocation())
                .language(opportunity.getLanguage())
                .scheduledDate(opportunity.getScheduledDate())
                .build();
    }
}
