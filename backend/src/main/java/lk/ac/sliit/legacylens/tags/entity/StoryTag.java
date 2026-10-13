package lk.ac.sliit.legacylens.tags.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "story_tags",
        uniqueConstraints = @UniqueConstraint(name = "uk_story_tags_story_tag", columnNames = {"story_id", "tag_id"}),
        indexes = {
                @Index(name = "idx_story_tags_story_id", columnList = "story_id"),
                @Index(name = "idx_story_tags_tag_id", columnList = "tag_id"),
                @Index(name = "idx_story_tags_source", columnList = "assignment_source")
        })
@Getter
@Setter
@NoArgsConstructor
public class StoryTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "story_id", nullable = false, columnDefinition = "uuid")
    private UUID storyId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "confidence")
    private Double confidence = 1.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_source", nullable = false, length = 30)
    private TagAssignmentSource assignmentSource = TagAssignmentSource.AI;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public StoryTag(UUID storyId, Tag tag, Double confidence, TagAssignmentSource assignmentSource) {
        this.storyId = storyId;
        this.tag = tag;
        this.confidence = confidence != null ? confidence : 1.0;
        this.assignmentSource = assignmentSource != null ? assignmentSource : TagAssignmentSource.AI;
    }
}

