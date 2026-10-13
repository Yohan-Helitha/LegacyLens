package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.service.JobWorkProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** The red number beside "Rejected Submissions" in the creator's menu, and clearing it once they have looked. */
@RestController
@RequestMapping("/api/creator/rejected-work")
public class CreatorRejectedWorkController {

    private final JobWorkProgressService progressService;

    public CreatorRejectedWorkController(JobWorkProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/unseen-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unseenCount(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", progressService.countUnseenRejected(principal.getUser().getId()))));
    }

    @PostMapping("/seen")
    public ResponseEntity<ApiResponse<Void>> markSeen(@AuthenticationPrincipal CustomUserDetails principal) {
        progressService.markRejectedSeen(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.ok("Rejected submissions marked as seen", null));
    }
}
