package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "featured_keepers",
        indexes = {
                @Index(name = "idx_featured_keeper_active_date", columnList = "active_date"),
                @Index(name = "idx_featured_keeper_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class FeaturedKeeper {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 100)
    private String tag;
    
    @Column(length = 1000, nullable = false)
    private String quote;
    
    @Column(length = 500)
    private String avatarUrl;
    
    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer likesCount = 0;

    @Column(name = "story_id", length = 100)
    private String storyId;

    @Column(name = "story_title", length = 255)
    private String storyTitle;

    @Column(name = "active_date")
    private LocalDate activeDate;

    @Column(name = "status", length = 30)
    private String status = "Active"; // Active | Scheduled | Draft

    @Column(name = "generated_by_ai")
    private Boolean generatedByAi = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
