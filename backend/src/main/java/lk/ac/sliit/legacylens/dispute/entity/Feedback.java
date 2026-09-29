package lk.ac.sliit.legacylens.dispute.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks")
@Data
@NoArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category; // UI/UX, Feature Request, Bug Report, General

    @Column(nullable = false)
    private int rating; // 1 to 5

    @Column(columnDefinition = "TEXT", nullable = false)
    private String comments;

    @Column(nullable = false)
    private String submittedBy; // Username or ID of the user

    @Column(nullable = false)
    private String status; // New, Reviewed, Implemented, Archived

    @Column(nullable = false)
    private LocalDateTime dateSubmitted;

    @PrePersist
    protected void onCreate() {
        dateSubmitted = LocalDateTime.now();
        if (status == null)
            status = "New";
    }
}
