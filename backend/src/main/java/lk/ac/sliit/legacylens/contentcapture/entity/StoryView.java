package lk.ac.sliit.legacylens.contentcapture.entity;

import jakarta.persistence.*;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One row per (story, viewer, day-ish window) — backs the 24h view-count
 * debounce in StoryViewTrackingService. Not a raw counter table: Story.viewCount
 * is the counter; this table is what lets us decide whether to bump it.
 */
@Entity
@Table(name = "story_views")
@Getter
@Setter
@NoArgsConstructor
public class StoryView {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    /** Nullable for a possible future anonymous-viewer case; every viewer today is an authenticated principal. */
    @Column(name = "viewer_id")
    private UUID viewerId;

    @CreationTimestamp
    @Column(name = "viewed_at", nullable = false, updatable = false)
    private LocalDateTime viewedAt;
}
