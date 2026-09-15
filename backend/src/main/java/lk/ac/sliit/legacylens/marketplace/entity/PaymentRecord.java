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
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A cash payment a creator manually logs as received — since this platform
 * never processes payment itself (elders pay creators directly, in cash),
 * this is a self-reported ledger entry, not a transaction record. Powers the
 * "Collected Today" total and payment History list on CreatorDashboard,
 * alongside completed Jobs (which are payments too, just earned by finishing
 * a specific piece of work rather than logged ad-hoc).
 */
@Entity
@Table(name = "payment_records")
@Getter
@Setter
@NoArgsConstructor
public class PaymentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** Optional free-text note, e.g. "Cash tip" or "Payment for photo prints". */
    @Column(length = 200)
    private String note;

    @CreationTimestamp
    @Column(name = "collected_at", nullable = false, updatable = false)
    private LocalDateTime collectedAt;
}
