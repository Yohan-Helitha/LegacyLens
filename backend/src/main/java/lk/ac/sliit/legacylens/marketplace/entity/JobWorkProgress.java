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

    /** The opening/context write-up — first of the two "Note & Written Content" sub-sections. */
    @Column(columnDefinition = "TEXT")
    private String introduction;

    /** The full story/main content write-up — second of the two "Note & Written Content" sub-sections. */
    @Column(columnDefinition = "TEXT")
    private String story;

    /**
     * "Search Context (SEO)" — a short search-result description of the
     * content, so beneficiaries can find it once it's published.
     */
    @Column(name = "seo_summary", length = 160)
    private String seoSummary;

    /** Comma separated search keywords/tags for the same purpose — see JobWorkProgressServiceImpl#updateSeo. */
    @Column(name = "seo_keywords", columnDefinition = "TEXT")
    private String seoKeywords;

    /** Explicitly saved via "Save As a Draft" — cleared once the work is actually submitted for review. */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean draft = false;

    /** Stamped the first time completedSteps reaches TOTAL_STEPS — never overwritten after that. */
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /**
     * Set when an admin sends this submission back with a reason instead of
     * accepting it — surfaced on RejectedWorkPage and as a banner on
     * ContinueMyWorkPage. Cleared automatically once the creator fixes the
     * issue and resubmits (see JobWorkProgressServiceImpl#submitDraft).
     * There's no admin review UI yet, so this is set directly the same way
     * every other not-yet-built admin action in this codebase is seeded.
     */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean rejected = false;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    /**
     * When the creator opened Rejected Submissions after this rejection. Null means they have not seen it
     * yet - what the red number on the menu counts. A new rejection clears it again.
     */
    @Column(name = "rejection_seen_at")
    private LocalDateTime rejectionSeenAt;

    /**
     * What the knowledge holder wants changed. Private to the creator and the admin - the knowledge
     * holder never sees the admin's note, and neither note is part of the published content.
     * Cleared when the creator resubmits (see JobWorkProgressServiceImpl#submitDraft).
     */
    @Column(name = "elder_feedback", columnDefinition = "TEXT")
    private String elderFeedback;

    @Column(name = "elder_feedback_at")
    private LocalDateTime elderFeedbackAt;

    /** What the admin wants changed. Visible to the creator only; the knowledge holder cannot see it. */
    @Column(name = "admin_feedback", columnDefinition = "TEXT")
    private String adminFeedback;

    @Column(name = "admin_feedback_at")
    private LocalDateTime adminFeedbackAt;

    /**
     * Each reviewer's go-ahead. The work is complete only when the knowledge holder AND the admin have
     * both approved and neither has feedback outstanding. Reset when the creator resubmits, so a changed
     * piece of work is looked at again.
     */
    @Column(name = "elder_approved", nullable = false, columnDefinition = "boolean default false")
    private boolean elderApproved = false;

    @Column(name = "admin_approved", nullable = false, columnDefinition = "boolean default false")
    private boolean adminApproved = false;

    /** Set when the admin publishes completed work - until then a completed job reads "Completed", after it "Published". */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /**
     * The post this work became in the users' feed. Null until it really is in the feed - which is how work that
     * was only flagged as published (before publishing created a post) is found and fixed.
     */
    @Column(name = "published_story_id")
    private java.util.UUID publishedStoryId;

    /** When the creator first opened this job to work on it; null until then - what the "New" tag on My Work follows. */
    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
