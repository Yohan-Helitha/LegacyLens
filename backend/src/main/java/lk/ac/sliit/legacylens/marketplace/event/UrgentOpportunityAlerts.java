package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityMatcher;
import lk.ac.sliit.legacylens.marketplace.matching.OpportunityMatcher.CreatorMatching;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

/**
 * When an urgent opportunity goes live, tells the creators it suits - those the matching engine rates
 * at {@value #MIN_MATCH_PERCENT}% or more and who may take it - on their phone. Anyone else, and any
 * creator who already applied, hears nothing. Each creator's own score is worked out by the same
 * engine that shows the percentage in the app.
 */
@Component
public class UrgentOpportunityAlerts {

    /** A creator is only alerted when the opportunity fits them at least this well. */
    static final int MIN_MATCH_PERCENT = 70;

    private static final Logger log = LoggerFactory.getLogger(UrgentOpportunityAlerts.class);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final OpportunityRepository opportunityRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final OpportunityMatcher matcher;
    private final PushNotificationService pushNotificationService;

    public UrgentOpportunityAlerts(
            OpportunityRepository opportunityRepository,
            CreatorProfileRepository creatorProfileRepository,
            OpportunityMatcher matcher,
            PushNotificationService pushNotificationService) {
        this.opportunityRepository = opportunityRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.matcher = matcher;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void alertMatchingCreators(UUID opportunityId) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId).orElse(null);
        if (opportunity == null || !opportunity.isUrgent()) {
            return;
        }

        for (CreatorProfile profile : creatorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED)) {
            UUID creatorId = profile.getUser().getId();
            try {
                CreatorMatching matching = matcher.forCreator(creatorId);
                if (!matching.isCreator() || !matching.isEligible(opportunity)) {
                    continue;
                }
                Match match = matching.score(opportunity);
                if (match != null && match.recommendableToCreator() && match.percentage() >= MIN_MATCH_PERCENT) {
                    pushNotificationService.sendToUser(creatorId, messageFor(opportunity, match.percentage()));
                }
            } catch (RuntimeException e) {
                log.warn("Could not alert creator {} about urgent opportunity {}", creatorId, opportunityId, e);
            }
        }
    }

    static PushMessage messageFor(Opportunity opportunity, int matchPercent) {
        String elder = opportunity.getElder() == null ? "a knowledge holder" : opportunity.getElder().getFullName();
        String when = whenText(opportunity);
        String body = "\"" + opportunity.getTitle() + "\" with " + elder
                + (when == null ? "" : " - " + when) + ". " + matchPercent + "% match.";
        return new PushMessage(
                "\uD83D\uDEA8 Urgent Opportunity",
                body,
                Map.of("type", "urgent-opportunity", "opportunityId", opportunity.getId().toString()));
    }

    private static String whenText(Opportunity opportunity) {
        LocalDate date = opportunity.getScheduledDate();
        if (date == null) {
            LocalDateTime due = opportunity.getDueAt();
            date = due == null ? null : due.toLocalDate();
        }
        return date == null ? null : date.format(DATE);
    }
}
