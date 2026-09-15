package lk.ac.sliit.legacylens.dispute.service;

import lk.ac.sliit.legacylens.dispute.entity.Complaint;
import lk.ac.sliit.legacylens.dispute.entity.Feedback;
import lk.ac.sliit.legacylens.dispute.repository.ComplaintRepository;
import lk.ac.sliit.legacylens.dispute.repository.FeedbackRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DisputeService {
    private final ComplaintRepository complaintRepository;
    private final FeedbackRepository feedbackRepository;

    public DisputeService(ComplaintRepository complaintRepository, FeedbackRepository feedbackRepository) {
        this.complaintRepository = complaintRepository;
        this.feedbackRepository = feedbackRepository;
    }

    // --- Complaints ---
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    public Complaint submitComplaint(Complaint complaint) {
        return complaintRepository.save(complaint);
    }

    public Complaint updateComplaintStatus(Long id, String status, String resolutionNotes) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        complaint.setStatus(status);
        if (resolutionNotes != null) {
            complaint.setResolutionNotes(resolutionNotes);
        }
        if (status.equals("Resolved") || status.equals("Dismissed")) {
            complaint.setDateResolved(LocalDateTime.now());
        }
        return complaintRepository.save(complaint);
    }

    // --- Feedbacks ---
    public List<Feedback> getAllFeedbacks() {
        return feedbackRepository.findAll();
    }

    public Feedback submitFeedback(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }

    public Feedback updateFeedbackStatus(Long id, String status) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        feedback.setStatus(status);
        return feedbackRepository.save(feedback);
    }
}
