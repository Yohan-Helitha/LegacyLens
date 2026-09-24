package lk.ac.sliit.legacylens.admin.dto;

import lk.ac.sliit.legacylens.admin.entity.AuditLog;
import lombok.Builder;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
@Builder
public class AuditLogResponse {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a");

    private String id;
    private String actionType;
    private String entityType;
    private String entityId;
    private String entityTitle;
    private String performedById;
    private String performedByName;
    private String notes;
    private String date;
    private String time;
    private String createdAt;

    public static AuditLogResponse from(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId() != null ? log.getId().toString() : null)
                .actionType(log.getActionType() != null ? log.getActionType().name() : null)
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .entityTitle(log.getEntityTitle())
                .performedById(log.getPerformedById())
                .performedByName(log.getPerformedByName())
                .notes(log.getNotes())
                .date(log.getCreatedAt() != null ? log.getCreatedAt().format(DATE_FMT) : null)
                .time(log.getCreatedAt() != null ? log.getCreatedAt().format(TIME_FMT) : null)
                .createdAt(log.getCreatedAt() != null ? log.getCreatedAt().toString() : null)
                .build();
    }
}
