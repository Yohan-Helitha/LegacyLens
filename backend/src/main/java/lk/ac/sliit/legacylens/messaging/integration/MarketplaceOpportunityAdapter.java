package lk.ac.sliit.legacylens.messaging.integration;

import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityCreatorInvitationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.messaging.dto.ConversationContextResponse;
import lk.ac.sliit.legacylens.messaging.entity.Conversation;
import lk.ac.sliit.legacylens.messaging.service.ConversationContextProvider;
import lk.ac.sliit.legacylens.messaging.service.OpportunityAccess;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Where messaging meets the marketplace: answers its questions about
 * opportunities from the marketplace repositories, so nothing else in the
 * messaging module has to know they exist.
 */
@Component
public class MarketplaceOpportunityAdapter implements OpportunityAccess, ConversationContextProvider {

    private final OpportunityRepository opportunityRepository;
    private final OpportunityApplicationRepository applicationRepository;
    private final OpportunityCreatorInvitationRepository invitationRepository;
    private final JobRepository jobRepository;

    public MarketplaceOpportunityAdapter(
            OpportunityRepository opportunityRepository,
            OpportunityApplicationRepository applicationRepository,
            OpportunityCreatorInvitationRepository invitationRepository,
            JobRepository jobRepository) {

        this.opportunityRepository = opportunityRepository;
        this.applicationRepository = applicationRepository;
        this.invitationRepository = invitationRepository;
        this.jobRepository = jobRepository;
    }

    @Override
    public Optional<Opportunity> findOpportunity(UUID opportunityId) {
        return opportunityRepository.findById(opportunityId);
    }

    @Override
    public boolean isCreatorConnected(UUID opportunityId, UUID creatorId) {
        boolean applied = applicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunityId)
                .filter(application -> application.getStatus() != OpportunityApplicationStatus.SAVED)
                .isPresent();
        return applied
                || invitationRepository.existsByOpportunityIdAndCreatorId(opportunityId, creatorId)
                || jobRepository.existsByOpportunityIdAndCreatorId(opportunityId, creatorId);
    }

    /** Booking details win over the opportunity's own schedule - they are what was actually agreed. */
    @Override
    public ConversationContextResponse contextFor(Conversation conversation) {
        Opportunity opportunity = conversation.getOpportunity();
        if (opportunity == null) {
            return null;
        }
        Job job = jobRepository
                .findFirstByOpportunityIdAndCreatorIdOrderByCreatedAtDesc(opportunity.getId(), conversation.getCreator().getId())
                .orElse(null);

        return ConversationContextResponse.builder()
                .opportunityId(opportunity.getId())
                .title(opportunity.getTitle())
                .subtitle(opportunity.getCategory())
                .date(job != null && job.getScheduledAt() != null ? job.getScheduledAt().toLocalDate() : opportunity.getScheduledDate())
                .timeWindowText(job != null && job.getTimeWindowText() != null ? job.getTimeWindowText() : opportunity.getTimeWindowText())
                .location(job != null && job.getLocation() != null ? job.getLocation() : opportunity.getLocation())
                .booked(job != null)
                .build();
    }
}
