package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AuditLogResponse;
import lk.ac.sliit.legacylens.admin.entity.AuditActionType;

import java.util.List;

public interface AdminAuditService {

    /**
     * Persist a new audit log entry.
     *
     * @param actionType      The type of action performed
     * @param entityType      Human-readable domain area (e.g. "Landmark", "Story",
     *                        "Opportunity")
     * @param entityId        String ID of the affected record (nullable)
     * @param entityTitle     Human-readable name of the affected record
     * @param performedById   Admin user ID (from X-Admin-Id header)
     * @param performedByName Admin display name (from X-Admin-Name header)
     * @param notes           Optional additional context / reason
     */
    void logAction(AuditActionType actionType,
            String entityType,
            String entityId,
            String entityTitle,
            String performedById,
            String performedByName,
            String notes);

    /** Return all audit entries ordered newest-first */
    List<AuditLogResponse> getAllLogs();

    /** Return audit entries filtered by entity type */
    List<AuditLogResponse> getLogsByEntityType(String entityType);
}
