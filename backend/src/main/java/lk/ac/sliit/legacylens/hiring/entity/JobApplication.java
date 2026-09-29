package lk.ac.sliit.legacylens.hiring.entity;

import jakarta.persistence.*;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A creator's application to a published JobRequest. Row creation is owned
 * by the Marketplace/Creator module (out of this module's scope, same as
 * how Opportunity/Job rows are seeded elsewhere) — this module only reads
 * and reviews (approve/reject) applications. Maps to `job_applications`.
 */
@Entity
@Table(name = "job_applications")
@Getter
@Setter
@NoArgsConstructor
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_request_id", nullable = false)
    private JobRequest jobRequest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobApplicationStatus status = JobApplicationStatus.PENDING;

    /**
     * Optional — an elder is never required to explain a rejection. Left
     * null for applications auto-rejected as a side effect of approving a
     * different applicant (see JobApplicationReviewService.approve), since
     * the elder didn't personally reject those.
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "applied_at", nullable = false, updatable = false)
    private LocalDateTime appliedAt;
}
