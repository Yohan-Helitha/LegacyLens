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
 * An elder's request to hire a creator to record/document something,
 * admin-gated before it's visible to creators. Maps to the `job_requests`
 * table. Once published, this is meant to feed the (separately built,
 * admin-owned) Opportunity listing that creators browse — see Opportunity's
 * own javadoc for that other half of the workflow.
 */
@Entity
@Table(name = "job_requests")
@Getter
@Setter
@NoArgsConstructor
public class JobRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elder_id", nullable = false)
    private User elder;

    @Column(nullable = false, length = 200)
    private String title;

    /** Optional when a voice note is attached instead — see JobRequestService validation. */
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "input_mode", nullable = false, length = 10)
    private InputMode inputMode;

    /** Root-relative URL, e.g. "/uploads/job-requests/xxx.m4a". Only set when inputMode is VOICE. */
    @Column(name = "voice_note_url", length = 255)
    private String voiceNoteUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private JobRequestStatus status = JobRequestStatus.DRAFT;

    /** Set by the (not-yet-built) admin review step — e.g. a rejection reason. */
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
