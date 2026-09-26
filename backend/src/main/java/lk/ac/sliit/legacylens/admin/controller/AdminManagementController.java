package lk.ac.sliit.legacylens.admin.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.admin.dto.AdminResponse;
import lk.ac.sliit.legacylens.admin.dto.ChangePinRequest;
import lk.ac.sliit.legacylens.admin.dto.UpdateAdminRequest;
import lk.ac.sliit.legacylens.admin.service.AdminManagementService;
import lk.ac.sliit.legacylens.admin.validation.admin_management.AdminProfileFormValidator;
import lk.ac.sliit.legacylens.admin.validation.admin_management.ChangePinFormValidator;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/management/admins")
@RequiredArgsConstructor
public class AdminManagementController {

    private final AdminManagementService adminManagementService;

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        binder.addValidators(new AdminProfileFormValidator(), new ChangePinFormValidator());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminResponse>>> getAllAdmins() {
        List<AdminResponse> admins = adminManagementService.getAllAdmins();
        return ResponseEntity.ok(ApiResponse.ok("Admins retrieved successfully", admins));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminResponse>> updateAdmin(
            @PathVariable String id,
            @Valid @RequestBody UpdateAdminRequest updates,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        AdminResponse updated = adminManagementService.updateAdmin(id, updates, adminId, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Administrator updated successfully", updated));
    }

    @PostMapping("/{id}/change-pin")
    public ResponseEntity<ApiResponse<Void>> changePin(
            @PathVariable String id,
            @Valid @RequestBody ChangePinRequest request,
            @RequestHeader(value = "X-Admin-Id", defaultValue = "unknown") String adminId,
            @RequestHeader(value = "X-Admin-Name", defaultValue = "Admin") String adminName) {
        adminManagementService.changePin(id, request.getNewPin(), adminId, adminName);
        return ResponseEntity.ok(ApiResponse.ok("PIN changed successfully", null));
    }
}
