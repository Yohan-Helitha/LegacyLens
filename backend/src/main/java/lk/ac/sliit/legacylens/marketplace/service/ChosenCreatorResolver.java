package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.RecommendedCreatorResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorInvitationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityCreatorInvitation;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.Match;
import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Works out which creator, if any, an elder has already picked for an opportunity. */
@Component
public class ChosenCreatorResolver {

    /** Application statuses that mean this creator has already been picked for the opportunity. */
    private static final Set<OpportunityApplicationStatus> CHOSEN_APPLICATION_STATUSES =
            Set.of(OpportunityApplicationStatus.APPROVED, OpportunityApplicationStatus.BOOKED);

    private final RecommendationResponseMapper mapper;

    public ChosenCreatorResolver(RecommendationResponseMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * The creator already picked for this opportunity — an approved/booked
     * application first (it's the stronger commitment), then an open
     * invitation. Null while nobody has been chosen.
     */
    public UUID chosenCreatorId(List<OpportunityApplication> applications, List<OpportunityCreatorInvitation> invitations) {
        return applications.stream()
                .filter(application -> CHOSEN_APPLICATION_STATUSES.contains(application.getStatus()))
                .map(application -> application.getCreator().getId())
                .findFirst()
                .or(() -> invitations.stream()
                        .filter(invitation -> invitation.getStatus() != CreatorInvitationStatus.DECLINED)
                        .map(invitation -> invitation.getCreator().getId())
                        .findFirst())
                .orElse(null);
    }

    public RecommendedCreatorResponse resolve(
            List<OpportunityApplication> applications,
            List<OpportunityCreatorInvitation> invitations,
            Map<UUID, CreatorCandidate> candidatesById,
            List<Match> ranked) {

        UUID chosenId = chosenCreatorId(applications, invitations);
        if (chosenId == null) {
            return null;
        }

        // Reuse the ranked match (with its reasons) when the chosen creator was recommended.
        Match match = ranked.stream()
                .filter(m -> m.candidate().user().getId().equals(chosenId))
                .findFirst()
                .orElse(null);
        if (match != null) {
            return mapper.toResponse(match);
        }

        CreatorCandidate candidate = candidatesById.get(chosenId);
        if (candidate != null) {
            return mapper.toUnscoredResponse(candidate);
        }

        // Chosen before they stopped being a verified/active creator — still show who it was.
        User chosenUser = applications.stream()
                .map(OpportunityApplication::getCreator)
                .filter(user -> user.getId().equals(chosenId))
                .findFirst()
                .or(() -> invitations.stream()
                        .map(OpportunityCreatorInvitation::getCreator)
                        .filter(user -> user.getId().equals(chosenId))
                        .findFirst())
                .orElse(null);
        return chosenUser == null ? null : mapper.toUnscoredResponse(new CreatorCandidate(chosenUser, null, null, 0));
    }
}
