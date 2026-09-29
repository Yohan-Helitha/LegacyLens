package lk.ac.sliit.legacylens.dispute.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.dispute.entity.Complaint;
import lk.ac.sliit.legacylens.dispute.entity.Feedback;
import lk.ac.sliit.legacylens.dispute.service.DisputeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {
    private final DisputeService disputeService;

    // --- Complaints ---
    @GetMapping("/complaints")
    public ResponseEntity<ApiResponse<List<Complaint>>> getAllComplaints() {
        return ResponseEntity.ok(ApiResponse.ok(disputeService.getAllComplaints()));
    }

    @PostMapping("/complaints")
    public ResponseEntity<ApiResponse<Complaint>> submitComplaint(@RequestBody Complaint complaint) {
        return ResponseEntity.ok(ApiResponse.ok("Complaint submitted successfully", disputeService.submitComplaint(complaint)));
    }

    @PutMapping("/complaints/{id}/status")
    public ResponseEntity<ApiResponse<Complaint>> updateComplaintStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String resolutionNotes = payload.get("resolutionNotes");
        return ResponseEntity.ok(ApiResponse.ok("Complaint status updated", disputeService.updateComplaintStatus(id, status, resolutionNotes)));
    }

    // --- Feedbacks ---
    @GetMapping("/feedbacks")
    public ResponseEntity<ApiResponse<List<Feedback>>> getAllFeedbacks() {
        return ResponseEntity.ok(ApiResponse.ok(disputeService.getAllFeedbacks()));
    }

    @PostMapping("/feedbacks")
    public ResponseEntity<ApiResponse<Feedback>> submitFeedback(@RequestBody Feedback feedback) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback submitted successfully", disputeService.submitFeedback(feedback)));
    }

    @PutMapping("/feedbacks/{id}/status")
    public ResponseEntity<ApiResponse<Feedback>> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(ApiResponse.ok("Feedback status updated", disputeService.updateFeedbackStatus(id, status)));
    }
}
