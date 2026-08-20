package lk.ac.sliit.legacylens.users.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Extended profile for users who hold the YOUTH_CREATOR role.
 * One to one relationship with the `users` table.
 * Maps to the `creator profiles` table.
 */
@Entity
@Table(name = "creator_profiles")
@Getter
@Setter
@NoArgsConstructor
public class CreatorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Back reference to the owning user. Each user may have at most one creator profile. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Comma separated or free text list of skills the creator offers
     * (e.g. "Video Editing, Photography, Translation").
     */
    @Column(columnDefinition = "TEXT")
    private String skills;

    /**
     * Comma separated or free text list of the creator's cultural/domain interests.
     */
    @Column(columnDefinition = "TEXT")
    private String interests;

    /**
     * Admin / moderator review status for this creator profile.
     * Starts as PENDING; becomes VERIFIED after admin review.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    /**
     * Aggregate star rating from job completions (0.00 5.00).
     * Nullable until the creator completes at least one job.
     */
    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
