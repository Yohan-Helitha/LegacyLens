package lk.ac.sliit.legacylens.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A single OTP challenge issued to a phone number.
 * Maps to the `otp_verifications` table (auto-created by Hibernate since
 * ddl-auto=update — no manual migration needed in dev).
 *
 * The code itself is stored hashed (BCrypt), the same way PINs are —
 * never in plain text, even for something this short-lived.
 */
@Entity
@Table(name = "otp_verifications")
@Getter
@Setter
@NoArgsConstructor
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = 20)
    private OtpPurpose purpose;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "consumed", nullable = false)
    private boolean consumed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
