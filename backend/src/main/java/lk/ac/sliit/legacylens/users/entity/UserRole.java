package lk.ac.sliit.legacylens.users.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Join table between users and their roles.
 * A single user can hold multiple roles (e.g. GENERAL_USER + ELDER).
 * Maps to the `user_roles` table.
 */
@Entity
@Table(
    name = "user_roles",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role_type"})
)
@Getter
@Setter
@NoArgsConstructor
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** The user who owns this role assignment. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The role being assigned.
     * Stored as a STRING so the DB column holds the human-readable enum name.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role_type", nullable = false, length = 30)
    private RoleType roleType;

    /** Whether this role assignment is currently active. */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RoleStatus status = RoleStatus.ACTIVE;

    /** Timestamp when this role was activated (nullable for pending roles). */
    @Column(name = "activated_at")
    private LocalDateTime activatedAt;
}
