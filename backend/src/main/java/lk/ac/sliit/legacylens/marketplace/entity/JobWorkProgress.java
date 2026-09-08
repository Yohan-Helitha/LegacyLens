package lk.ac.sliit.legacylens.marketplace.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tracks a creator's progress through the Prep -> Record -> Edit -> Submit
 * stages of a Job — backs MyWorkList and ContinueMyWorkPage. One row per Job,
 * created lazily the first time its progress is read or advanced.
 */
@Entity
@Table(name = "job_work_progress")
@Getter
@Setter
@NoArgsConstructor
public class JobWorkProgress {

    public static final int TOTAL_STEPS = 4;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;

    @Column(name = "completed_steps", nullable = false, columnDefinition = "integer default 0")
    private int completedSteps = 0;

    @Column(columnDefinition = "TEXT")
    private String note;

    /** Explicitly saved via "Save As a Draft" — cleared once the work is actually submitted for review. */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean draft = false;

    /** Stamped the first time completedSteps reaches TOTAL_STEPS — never overwritten after that. */
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
