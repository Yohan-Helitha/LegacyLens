package lk.ac.sliit.legacylens.marketplace.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * An elder choosing a recommended creator who has NOT applied to their
 * opportunity yet (Content Creator Recommendation screen → "Choose"). When
 * the creator has already applied, choosing approves that
 * OpportunityApplication instead and no invitation is created — see
 * CreatorRecommendationServiceImpl#chooseCreator.
 *
 * One row per (opportunity, creator) pair. Maps to the
 * `opportunity_creator_invitations` table.
 */
@Entity
@Table(name = "opportunity_creator_invitations",
        uniqueConstraints = @UniqueConstraint(columnNames = { "opportunity_id", "creator_id" }))
@Getter
@Setter
@NoArgsConstructor
public class OpportunityCreatorInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opportunity_id", nullable = false)
    private Opportunity opportunity;

    /** The recommended content creator the elder chose. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CreatorInvitationStatus status = CreatorInvitationStatus.INVITED;

    @CreationTimestamp
    @Column(name = "invited_at", nullable = false, updatable = false)
    private LocalDateTime invitedAt;
}
