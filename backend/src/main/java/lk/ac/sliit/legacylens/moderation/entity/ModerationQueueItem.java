package lk.ac.sliit.legacylens.moderation.entity;

import jakarta.persistence.*;
import lk.ac.sliit.legacylens.moderation.converter.StringArrayConverter;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stories", indexes = {
        @Index(name = "idx_stories_status", columnList = "status"),
        @Index(name = "idx_stories_author", columnList = "author_id"),
        @Index(name = "idx_stories_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
public class ModerationQueueItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "body_content", columnDefinition = "TEXT")
    private String bodyContent;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "media_type", length = 30)
    private String type;

    @Column(name = "method", length = 30)
    private String method;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "author_id")
    private UUID authorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", insertable = false, updatable = false)
    private User author;

    @Column(name = "author_user_id", columnDefinition = "uuid")
    private UUID authorUserId;

    @Transient
    private String authorName;

    @Transient
    private boolean elder = false;

    @Column(name = "media_duration_millis")
    private Long mediaDurationMillis;

    @Column(name = "media_file_path", length = 500)
    private String mediaFilePath;

    @Column(name = "media_file_size_bytes")
    private Long mediaFileSizeBytes;

    @Column(name = "media_mime_type", length = 100)
    private String mediaMimeType;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Convert(converter = StringArrayConverter.class)
    @Column(name = "tags")
    private String[] tags;

    @Column(name = "likes_count", columnDefinition = "integer default 0")
    private Integer likesCount = 0;

    @Column(name = "comments_count", columnDefinition = "integer default 0")
    private Integer commentsCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModerationStatus status = ModerationStatus.PENDING;

    @Column(name = "rejection_reason", length = 100)
    private String rejectionReason;

    @Column(name = "rejection_notes", columnDefinition = "TEXT")
    private String rejectionNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Transient
    private boolean isRead = false;

    public String getAuthorName() {
        try {
            if (author != null && author.getFullName() != null) {
                return author.getFullName();
            }
        } catch (Exception ignored) {
        }
        return authorName != null ? authorName : "Unknown";
    }
}
