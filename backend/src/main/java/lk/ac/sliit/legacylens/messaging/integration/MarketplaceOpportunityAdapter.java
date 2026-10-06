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

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
        return card(opportunity, job);
    }

    /** Same cards as {@link #contextFor}, but all the bookings come from one query however long the inbox is. */
    @Override
    public Map<UUID, ConversationContextResponse> contextsFor(Collection<Conversation> conversations) {
        List<Conversation> aboutAnOpportunity = conversations.stream()
                .filter(conversation -> conversation.getOpportunity() != null)
                .toList();
        if (aboutAnOpportunity.isEmpty()) {
            return Map.of();
        }

        Set<UUID> opportunityIds = new HashSet<>();
        Set<UUID> creatorIds = new HashSet<>();
        for (Conversation conversation : aboutAnOpportunity) {
            opportunityIds.add(conversation.getOpportunity().getId());
            creatorIds.add(conversation.getCreator().getId());
        }

        // Newest first, so the first booking seen for a pair is the one contextFor would have picked.
        Map<Booking, Job> newestBooking = new HashMap<>();
        for (Job job : jobRepository.findByOpportunityIdInAndCreatorIdInOrderByCreatedAtDesc(opportunityIds, creatorIds)) {
            newestBooking.putIfAbsent(new Booking(job.getOpportunityId(), job.getCreator().getId()), job);
        }

        Map<UUID, ConversationContextResponse> contexts = new HashMap<>();
        for (Conversation conversation : aboutAnOpportunity) {
            Opportunity opportunity = conversation.getOpportunity();
            Job job = newestBooking.get(new Booking(opportunity.getId(), conversation.getCreator().getId()));
            contexts.put(conversation.getId(), card(opportunity, job));
        }
        return contexts;
    }

    private record Booking(UUID opportunityId, UUID creatorId) { }

    private static ConversationContextResponse card(Opportunity opportunity, Job job) {
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
