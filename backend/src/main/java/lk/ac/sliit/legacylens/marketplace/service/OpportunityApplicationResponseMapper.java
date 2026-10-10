package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.matching.LanguageSkills;
import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Turns an application into what the app shows - for the creator who wrote it and for the
 * elder reviewing it. The opportunity's own details are read live, never copied (see
 * OpportunityApplication's javadoc).
 */
@Component
class OpportunityApplicationResponseMapper {

    OpportunityApplicationResponse toResponse(OpportunityApplication application) {
        Opportunity opportunity = application.getOpportunity();
        User creator = application.getCreator();

        return OpportunityApplicationResponse.builder()
                .id(application.getId())
                .opportunityId(opportunity.getId())
                .creatorId(creator.getId())
                .creatorName(creator.getFullName())
                .creatorPhotoUrl(creator.getProfilePhotoUrl())
                .title(opportunity.getTitle())
                .elderName(opportunity.getElder().getFullName())
                .location(opportunity.getLocation())
                .heroImageUrl(opportunity.getHeroImageUrl())
                .scheduledDate(opportunity.getScheduledDate())
                .timeWindowText(opportunity.getTimeWindowText())
                .offeredAmount(opportunity.getOfferedAmount())
                .skills(splitCsv(application.getSkills()))
                .experienceText(application.getExperienceText())
                .approachText(application.getApproachText())
                .availabilityConfirmed(application.isAvailabilityConfirmed())
                .equipment(splitCsv(application.getEquipment()))
                .languages(LanguageSkills.toResponses(LanguageSkills.deserialize(application.getLanguages())))
                .status(application.getStatus().name())
                .savedAt(application.getSavedAt())
                .submittedAt(application.getSubmittedAt())
                .build();
    }

    private static List<String> splitCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
