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
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A content creator's application to a single Opportunity — the record
 * behind OpportunityApplicationForm's Save/Submit and
 * SavedOpportunityApplication's Saved/Submitted lists. Maps to the
 * `opportunity_applications` table.
 *
 * One row per (creator, opportunity) pair — a creator applies to a given
 * opportunity at most once, so saving a draft again for the same opportunity
 * updates this same row rather than creating a second one. Unlike
 * CreatorApplication, the opportunity's own details (title, elder, location,
 * schedule) are never snapshotted here — they're read live through the
 * `opportunity` association each time, since a published Opportunity's
 * details don't meaningfully change after a creator has already seen and
 * applied to it.
 */
@Entity
@Table(name = "opportunity_applications",
        uniqueConstraints = @UniqueConstraint(columnNames = { "creator_id", "opportunity_id" }))
@Getter
@Setter
@NoArgsConstructor
public class OpportunityApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** The content creator who applied. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    /** The opportunity being applied to. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opportunity_id", nullable = false)
    private Opportunity opportunity;

    /** Comma separated skill tags selected from the "Relevant Skill" checkbox list. */
    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(name = "experience_text", columnDefinition = "TEXT")
    private String experienceText;

    @Column(name = "approach_text", columnDefinition = "TEXT")
    private String approachText;

    @Column(name = "availability_confirmed", nullable = false)
    private boolean availabilityConfirmed = false;

    /** Comma separated tags selected from the "Equipment" checkbox list. */
    @Column(columnDefinition = "TEXT")
    private String equipment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OpportunityApplicationStatus status = OpportunityApplicationStatus.SAVED;

    /** Set once, when the draft is first created — never touched by later edits. */
    @CreationTimestamp
    @Column(name = "saved_at", nullable = false, updatable = false)
    private LocalDateTime savedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** Set when the creator submits (SAVED -> PENDING); null until then. */
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}
