package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AuditLogResponse;
import lk.ac.sliit.legacylens.admin.entity.AuditActionType;
import lk.ac.sliit.legacylens.admin.entity.AuditLog;
import lk.ac.sliit.legacylens.admin.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAuditServiceImpl implements AdminAuditService {

    private static final Logger log = LoggerFactory.getLogger(AdminAuditServiceImpl.class);

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(AuditActionType actionType,
            String entityType,
            String entityId,
            String entityTitle,
            String performedById,
            String performedByName,
            String notes) {
        try {
            AuditLog entry = AuditLog.builder()
                    .actionType(actionType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityTitle(entityTitle)
                    .performedById(performedById)
                    .performedByName(performedByName != null ? performedByName : performedById)
                    .notes(notes)
                    .build();
            auditLogRepository.save(entry);
            log.debug("[Audit] {} on {} '{}' by {}", actionType, entityType, entityTitle, performedByName);
        } catch (Exception e) {
            // Audit failures must never break the primary operation
            log.error("[Audit] Failed to persist audit entry: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AuditLogResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByEntityType(String entityType) {
        return auditLogRepository.findByEntityTypeIgnoreCaseOrderByCreatedAtDesc(entityType)
                .stream()
                .map(AuditLogResponse::from)
                .collect(Collectors.toList());
    }
}
