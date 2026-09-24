package lk.ac.sliit.legacylens.marketplace.entity;

import jakarta.persistence.*;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A GENERAL_USER's application to become a YOUTH_CREATOR.
 * One to one with the `users` table — a user has at most one application on
 * file at a time. Maps to the `creator_applications` table.
 *
 * full_name / phone_number / city / nic_number are snapshotted from the
 * user's own profile at submission time (auto-filled server-side, never
 * re-entered by the applicant) so the record an admin reviews stays exactly
 * what was true when the application was submitted, even if the user later
 * edits their profile.
 */
@Entity
@Table(name = "creator_applications")
@Getter
@Setter
@NoArgsConstructor
public class CreatorApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Back reference to the applicant. Each user may have at most one application. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Snapshot of User.fullName at submission time. */
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    /** Snapshot of User.phoneNumber at submission time. */
    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    /** Snapshot of User.city's name at submission time. */
    @Column(name = "city", length = 100)
    private String city;

    /** Snapshot of User.nicNumber at submission time — never exposed publicly. */
    @Column(name = "nic_number", nullable = false, length = 20)
    private String nicNumber;

    /** Contact email collected on the application form (not stored on User). */
    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "about_you", columnDefinition = "TEXT")
    private String aboutYou;

    /** Comma separated skill tags selected from the "My Skill" checkbox list. */
    @Column(columnDefinition = "TEXT")
    private String skills;

    /** Comma separated tags selected from the "Interests" checkbox list. */
    @Column(columnDefinition = "TEXT")
    private String interests;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level", nullable = false, length = 30)
    private ExperienceLevel experienceLevel;

    @Column(name = "experience_description", columnDefinition = "TEXT")
    private String experienceDescription;

    /** Relative URL of the stored verification proof file — the review evidence. */
    @Column(name = "proof_document_url", nullable = false, length = 255)
    private String proofDocumentUrl;

    /**
     * Admin review status. Starts PENDING; an admin moves it to VERIFIED
     * (grants the YOUTH_CREATOR role) or REJECTED (the applicant may edit
     * and resubmit).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStatus status = VerificationStatus.PENDING;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;
}
