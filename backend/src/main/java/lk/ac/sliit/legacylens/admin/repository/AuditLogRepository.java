package lk.ac.sliit.legacylens.admin.repository;

import lk.ac.sliit.legacylens.admin.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /** All logs, newest-first */
    List<AuditLog> findAllByOrderByCreatedAtDesc();

    /** Filter by entity type (e.g. "Landmark") */
    List<AuditLog> findByEntityTypeIgnoreCaseOrderByCreatedAtDesc(String entityType);

    /** Filter by performer */
    List<AuditLog> findByPerformedByIdOrderByCreatedAtDesc(String performedById);

    /** Entries created on or after a given timestamp (for "today" / "last 7 days" etc.) */
    List<AuditLog> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime since);
}
