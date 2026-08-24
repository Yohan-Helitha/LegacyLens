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
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A piece of documentation work an elder wants done, curated for content
 * creators to browse — the record behind OpportunityPage's Recommended/Urgent/
 * Recent sections and OpportunityDetailPage's full view. Maps to the
 * `opportunities` table.
 *
 * The intended real workflow (per the team's plan): an elder records an audio
 * request, an admin listens to it and transcribes the fields below, then
 * publishes it. That intake + admin review UI is a separate, not-yet-built
 * feature owned by another team member — this entity is only the shared data
 * both sides read/write, so their work and this creator-facing read side can
 * be built independently. Until that admin UI exists, rows are seeded directly.
 */
@Entity
@Table(name = "opportunities")
@Getter
@Setter
@NoArgsConstructor
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** The elder (knowledge holder) this opportunity is on behalf of. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elder_id", nullable = false)
    private User elder;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "hero_image_url", length = 500)
    private String heroImageUrl;

    @Column(length = 150)
    private String location;

    /** Free-text admin-assigned category, e.g. "Photography", "Oral History", "Writing", "Video". */
    @Column(length = 50)
    private String category;

    /** e.g. "On-Site" or "Remote OK". */
    @Column(name = "location_type", length = 30)
    private String locationType;

    /**
     * Static, admin/seed-set relevance score (0-100) shown as "xx% MATCH" on
     * the Recommended card. Not computed from any live recommendation engine —
     * that's future work.
     */
    @Column(name = "match_percentage")
    private Integer matchPercentage;

    /** Whether this shows up in the Urgent Missions section. */
    @Column(nullable = false)
    private boolean urgent = false;

    /** Deadline backing the "Due in N days" badge — only meaningful when urgent = true. */
    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    /** Free text, e.g. "3 - 4 h". */
    @Column(name = "duration_text", length = 50)
    private String durationText;

    /** Free text, e.g. "10.00 AM - 1.00 PM". */
    @Column(name = "time_window_text", length = 50)
    private String timeWindowText;

    /** The language the elder will speak in, e.g. "Sinhala", "Tamil". */
    @Column(length = 50)
    private String language;

    @Column(name = "offered_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal offeredAmount;

    /** The elder's own words on what they want preserved — shown as a quote on the detail page. */
    @Column(name = "preservation_goal", columnDefinition = "TEXT")
    private String preservationGoal;

    /** Newline-separated "What you'll do" checklist items. */
    @Column(columnDefinition = "TEXT")
    private String tasks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OpportunityStatus status = OpportunityStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
