package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.dto.WorkProgressResponse;
import lk.ac.sliit.legacylens.marketplace.service.JobWorkProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** All of a creator's work progress at once, so a list screen needs one call instead of one per job. */
@RestController
@RequestMapping("/api/creator/work-progress")
public class CreatorWorkProgressController {

    private final JobWorkProgressService progressService;

    public CreatorWorkProgressController(JobWorkProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkProgressResponse>>> listMine(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(progressService.listMyProgress(principal.getUser().getId())));
    }
}
