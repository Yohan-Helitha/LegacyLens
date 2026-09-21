package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.admin.dto.AdminNotificationResponse;
import lk.ac.sliit.legacylens.admin.service.AdminNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    @GetMapping
    public ResponseEntity<List<AdminNotificationResponse>> getNotifications() {
        return ResponseEntity.ok(adminNotificationService.getAdminNotifications());
    }

    @PutMapping("/{type}/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String type, @PathVariable String id) {
        adminNotificationService.markNotificationAsRead(type, id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        adminNotificationService.markAllAsRead();
        return ResponseEntity.ok().build();
    }
}

