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

    /** Which opportunity this cash was collected for — optional since not every logged payment has to be tied to one. */
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "job_id")
    private Job job;

    /** The main amount collected for the selected opportunity (excludes any tip). */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** Cash tip collected alongside the main amount — tracked separately, but counted in every total shown to the creator. */
    @Column(name = "tip_amount", nullable = false, precision = 10, scale = 2, columnDefinition = "numeric(10,2) default 0")
    private BigDecimal tipAmount = BigDecimal.ZERO;

    /** Relative URL of the uploaded receipt/proof photo — see FileStorageService. */
    @Column(name = "proof_document_url", length = 255)
    private String proofDocumentUrl;

    /** Optional free-text note, e.g. "Cash tip" or "Payment for photo prints". */
    @Column(length = 200)
    private String note;

    @CreationTimestamp
    @Column(name = "collected_at", nullable = false, updatable = false)
    private LocalDateTime collectedAt;
}
