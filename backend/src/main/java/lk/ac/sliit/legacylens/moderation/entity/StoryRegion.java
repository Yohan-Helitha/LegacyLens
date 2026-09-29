package lk.ac.sliit.legacylens.moderation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "story_regions", indexes = {
        @Index(name = "idx_story_regions_story_id", columnList = "story_id"),
        @Index(name = "idx_story_regions_region", columnList = "region"),
        @Index(name = "idx_story_regions_district", columnList = "district")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryRegion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "story_id", columnDefinition = "uuid", nullable = false, unique = true)
    private UUID storyId;

    @Column(name = "region", nullable = false, length = 100)
    private String region;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "region_code", length = 50)
    private String regionCode;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

