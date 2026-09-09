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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One official required task for an Opportunity — e.g. "Record the cooking
 * process" — set by the elder/admin when the opportunity is created or
 * edited (same seeded-directly workflow as Opportunity itself; there's no
 * admin authoring UI yet). A creator never creates or edits these; they only
 * check them off per booking via WorkChecklistProgress.
 *
 * Kept separate from Opportunity.tasks (the older newline-separated free-text
 * field shown as a static "what you'll do" list) because each item here needs
 * its own stable id and completion state to track per-booking progress.
 */
@Entity
@Table(name = "opportunity_checklist_items")
@Getter
@Setter
@NoArgsConstructor
public class OpportunityChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "opportunity_id", nullable = false)
    private Opportunity opportunity;

    @Column(nullable = false, length = 255)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
