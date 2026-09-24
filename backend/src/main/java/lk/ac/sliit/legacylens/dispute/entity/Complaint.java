package lk.ac.sliit.legacylens.dispute.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String details;

    @Column(nullable = false)
    private String targetEntity; // e.g. User, Content, System

    @Column(name = "target_entity_id")
    private String targetEntityId; // e.g. the ID of the content or user

    @Column(nullable = false)
    private String reportedBy; // Username or ID of the user who submitted

    @Column(nullable = false)
    private String status; // Pending, Under Review, Resolved, Dismissed

    @Column(nullable = false)
    private String priority; // High, Medium, Low

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(nullable = false)
    private LocalDateTime dateSubmitted;

    private LocalDateTime dateResolved;

    @PrePersist
    protected void onCreate() {
        dateSubmitted = LocalDateTime.now();
        if (status == null)
            status = "Pending";
        if (priority == null)
            priority = "Medium";
    }
}
