package lk.ac.sliit.legacylens.notifications.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.notifications.dto.RegisterDeviceRequest;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The phone tells the server where to send its notifications. Requires a signed-in user. */
@RestController
@RequestMapping("/api/notifications/devices")
public class PushDeviceController {

    private final PushNotificationService pushNotificationService;

    public PushDeviceController(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> register(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody RegisterDeviceRequest request) {

        pushNotificationService.registerDevice(principal.getUser().getId(), request.getToken(), request.getPlatform());
        return ResponseEntity.ok(ApiResponse.ok("Device registered", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> unregister(@RequestParam String token) {
        pushNotificationService.unregisterDevice(token);
        return ResponseEntity.ok(ApiResponse.ok("Device removed", null));
    }
}
