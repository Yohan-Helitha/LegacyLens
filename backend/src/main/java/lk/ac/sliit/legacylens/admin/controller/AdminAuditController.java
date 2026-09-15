package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.admin.dto.AuditLogResponse;
import lk.ac.sliit.legacylens.admin.service.AdminAuditService;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
public class AdminAuditController {

    private final AdminAuditService adminAuditService;

    /**
     * GET /api/admin/audit
     * Returns all audit log entries, newest-first.
     *
     * Optional query param: entityType (e.g. "Landmark", "Story", "Opportunity")
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String entityType) {

        List<AuditLogResponse> logs = (entityType != null && !entityType.isBlank())
                ? adminAuditService.getLogsByEntityType(entityType)
                : adminAuditService.getAllLogs();

        return ResponseEntity.ok(ApiResponse.ok("Audit logs retrieved successfully", logs));
    }
}
