package lk.ac.sliit.legacylens.contentcapture.entity;

import jakarta.persistence.*;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A single piece of feedback (score + optional written review) left for an
 * elder by someone they've worked with — distinct from the marketplace
 * module's Review entity, which rates a creator for a completed Job in the
 * opposite direction. Maps to the `elder_ratings` table.
 */
@Entity
@Table(name = "elder_ratings")
@Getter
@Setter
@NoArgsConstructor
public class ElderRating {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** The elder being rated. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elder_id", nullable = false)
    private User elder;

    /** Whoever left the rating. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rated_by_user_id", nullable = false)
    private User ratedBy;

    @Column(nullable = false)
    private int score;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
