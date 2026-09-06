package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.PaymentRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, UUID> {

    List<PaymentRecord> findByCreatorIdOrderByCollectedAtDesc(UUID creatorId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount + p.tipAmount), 0) FROM PaymentRecord p "
            + "WHERE p.creator.id = :creatorId AND p.collectedAt BETWEEN :start AND :end")
    BigDecimal sumByCreatorIdAndCollectedAtBetween(
            @Param("creatorId") UUID creatorId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
