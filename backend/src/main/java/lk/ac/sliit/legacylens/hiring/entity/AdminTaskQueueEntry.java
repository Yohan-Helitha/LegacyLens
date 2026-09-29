package lk.ac.sliit.legacylens.hiring.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A minimal placeholder queue table — this module (elder-side hiring) only
 * ever inserts into it via AdminNotificationPort when a JobRequest needs
 * review. The not-yet-built Admin/Archive module owns consuming/resolving
 * these rows; nothing here reads them back. Maps to `admin_task_queue`.
 */
@Entity
@Table(name = "admin_task_queue")
@Getter
@Setter
@NoArgsConstructor
public class AdminTaskQueueEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** e.g. "JOB_REQUEST_REVIEW". Free-text rather than an enum — this queue is meant to grow beyond this module. */
    @Column(name = "task_type", nullable = false, length = 50)
    private String taskType;

    @Column(name = "reference_id", nullable = false)
    private UUID referenceId;

    @Column(nullable = false)
    private boolean resolved = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
