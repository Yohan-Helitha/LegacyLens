package lk.ac.sliit.legacylens.marketplace.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Whether ONE creator's booking (a Job — this codebase has no separate
 * "bookings" table, Job already is the confirmed per-creator work record)
 * has completed ONE of its Opportunity's required checklist items.
 *
 * Completion is intentionally split from OpportunityChecklistItem: the same
 * opportunity could in principle be booked by more than one creator, and
 * each creator's completion state must be independent — the task list itself
 * is shared, but "done" belongs to a specific job.
 *
 * Rows are created lazily (see JobWorkProgressServiceImpl#ensureChecklistProgress)
 * the first time a job's progress is read, rather than eagerly at booking
 * time — that one mechanism also self-heals if the elder adds a new
 * checklist item to the opportunity after the booking already exists.
 */
@Entity
@Table(
        name = "work_checklist_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "checklist_item_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class WorkChecklistProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "checklist_item_id", nullable = false)
    private OpportunityChecklistItem checklistItem;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
