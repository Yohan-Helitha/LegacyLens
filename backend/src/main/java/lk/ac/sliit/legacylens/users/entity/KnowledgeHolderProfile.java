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
 * Extended profile for users who hold the ELDER role (knowledge holders).
 * One to one relationship with the `users` table.
 * Maps to the `knowledg holder profiles` table.
 */
@Entity
@Table(name = "knowledge_holder_profiles")
@Getter
@Setter
@NoArgsConstructor
public class KnowledgeHolderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Back reference to the owning user. Each user may have at most one elder profile. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** The primary geographic region the elder represents (e.g. "Southern Province"). */
    @Column(name = "primary_region", length = 100)
    private String primaryRegion;

    /**
     * Comma separated or free-text description of topics the elder can speak about.
     * Stored as TEXT to allow long lists.
     */
    @Column(name = "known_topics", columnDefinition = "TEXT")
    private String knownTopics;

    /**
     * Platform-computed trust score (0.00 100.00).
     * Increases as content is validated by the community.
     */
    @Column(name = "trust_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal trustScore = BigDecimal.ZERO;

    /** Short biography shown on the elder's public profile. */
    @Column(columnDefinition = "TEXT")
    private String bio;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
