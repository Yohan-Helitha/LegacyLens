package lk.ac.sliit.legacylens.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "admin_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** High-level action category */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AuditActionType actionType;

    /** Affected domain entity (e.g. "Landmark", "Opportunity", "User Verification") */
    @Column(nullable = false, length = 100)
    private String entityType;

    /** ID of the affected record (stringified) */
    @Column(length = 200)
    private String entityId;

    /** Human-readable name / title of the affected record */
    @Column(length = 500)
    private String entityTitle;

    /** Admin user ID who performed the action (from X-Admin-Id header or Security context) */
    @Column(length = 200)
    private String performedById;

    /** Full display name of the admin who performed the action */
    @Column(length = 200)
    private String performedByName;

    /** Optional notes / reason / justification */
    @Column(length = 2000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
