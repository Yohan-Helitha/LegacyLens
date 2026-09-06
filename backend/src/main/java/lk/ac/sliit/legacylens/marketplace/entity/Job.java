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
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A piece of work a creator has taken on for an elder — the record behind
 * CreatorDashboard's Active/Upcoming/Completed tabs, recent work list, and
 * available-balance total. Maps to the `jobs` table.
 *
 * Nothing creates these yet — assignment (an elder posting an opportunity,
 * a creator accepting it) is a separate, not-yet-built feature. For now this
 * is the read side only; rows exist via direct seeding until that flow ships.
 */
@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** The creator who took on (or will take on) this job. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    /** The elder this work is being done for. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elder_id", nullable = false)
    private User elder;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 150)
    private String location;

    /** Amount agreed with the elder, paid in cash directly to the creator — not processed by this platform. */
    @Column(name = "offered_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal offeredAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.UPCOMING;

    /**
     * Static, admin/seed-set flag (same convention as Opportunity.urgent) —
     * shown as a distinct colour on OpportunitySchedulePage's calendar so a
     * time-sensitive booking stands out from the creator's other scheduled
     * work. Nothing computes this automatically yet.
     */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean urgent = false;

    /** When the work is/was scheduled to happen. */
    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    /** Set once the creator finishes the work. Null until then. */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
