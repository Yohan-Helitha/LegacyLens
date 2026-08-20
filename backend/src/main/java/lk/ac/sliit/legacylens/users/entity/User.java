package lk.ac.sliit.legacylens.users.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Core user record.  Maps to the `users` table.
 *
 * Auth credentials: phone number (unique login ID) + pin hash (BCrypt).
 * City is stored as a FK to the `cities` table for cleaner frontend selects.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    /** Primary login identifier must be unique across the platform. */
    @Column(name = "phone_number", nullable = false, unique = true, length = 15)
    private String phoneNumber;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified = false;

    /** FK to the cities lookup table. Nullable until the user completes registration. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    /** National Identity Card number used for verification only, never exposed publicly. */
    @Column(name = "nic_number", nullable = false, unique = true, length = 20)
    private String nicNumber;

    @Column(name = "profile_photo_url", length = 255)
    private String profilePhotoUrl;

    /** BCrypt hash of the user's 4-6 digit PIN. Never stored in plain text. */
    @Column(name = "pin_hash", nullable = false, length = 255)
    private String pinHash;

    @Column(name = "fingerprint_enabled", nullable = false)
    private boolean fingerprintEnabled = false;

    @Column(name = "failed_pin_attempts", nullable = false)
    private int failedPinAttempts = 0;

    /**
     * Current account status.
     * Stored as a STRING so the DB column holds the human-readable enum name.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 20)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    /** Roles assigned to this user. */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<UserRole> roles = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
