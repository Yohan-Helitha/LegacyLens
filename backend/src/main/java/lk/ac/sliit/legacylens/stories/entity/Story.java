package lk.ac.sliit.legacylens.stories.entity;

import jakarta.persistence.*;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A single captured story: title, optional description, optional media clip
 * (audio/video), and the method used to capture it. Maps to the `stories`
 * table.
 *
 * One clip per story today, matching the mobile app's record → review →
 * save flow (RecordCapture/upload → StoryDetails) — the media fields live
 * directly on this row rather than in a separate table, since there's
 * nothing yet that needs a story to have more than one clip.
 */
@Entity
@Table(name = "stories")
@Getter
@Setter
@NoArgsConstructor
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** The storyteller (ELDER) who captured this story. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StoryStatus status = StoryStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StoryMethod method;

    /** Null when the story has no media clip (e.g. a WRITTEN story). */
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", length = 10)
    private MediaType mediaType;

    /** Path relative to the storage root, e.g. "stories/3f9c...-e1.m4a" — see FileStorageService. */
    @Column(name = "media_file_path", length = 255)
    private String mediaFilePath;

    @Column(name = "media_mime_type", length = 100)
    private String mediaMimeType;

    @Column(name = "media_duration_millis")
    private Long mediaDurationMillis;

    @Column(name = "media_file_size_bytes")
    private Long mediaFileSizeBytes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
