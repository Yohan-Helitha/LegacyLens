package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.marketplace.service.TodayWorkReminderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/** TEMPORARY - sends the signed-in creator today's work reminder right now, so it can be tried without waiting. */
@RestController
@RequestMapping("/api/creator-dashboard/test")
public class TemporaryReminderTestController {

    private final TodayWorkReminderService reminderService;

    public TemporaryReminderTestController(TodayWorkReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @PostMapping("/remind-today")
    public ResponseEntity<ApiResponse<Integer>> remindToday(@AuthenticationPrincipal CustomUserDetails principal) {
        int jobs = reminderService.remindNow(principal.getUser().getId(), LocalDateTime.now(TodayWorkReminderService.LOCAL_ZONE));
        return ResponseEntity.ok(ApiResponse.ok(jobs == 0 ? "Nothing is scheduled for today" : "Reminder sent for " + jobs + " job(s)", jobs));
    }
}
