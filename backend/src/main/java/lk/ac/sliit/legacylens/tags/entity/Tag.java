package lk.ac.sliit.legacylens.tags.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tags", indexes = {
        @Index(name = "idx_tags_normalized_name", columnList = "normalized_name", unique = true),
        @Index(name = "idx_tags_category", columnList = "category"),
        @Index(name = "idx_tags_is_approved", columnList = "is_approved")
})
@Getter
@Setter
@NoArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "canonical_name", nullable = false, length = 150)
    private String canonicalName;

    @Column(name = "normalized_name", nullable = false, unique = true, length = 150)
    private String normalizedName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "language_code", length = 20)
    private String languageCode = "en";

    @Column(length = 50)
    private String category;

    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    @Column(name = "is_approved", nullable = false)
    private boolean isApproved = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Tag(String canonicalName, String normalizedName, String description, String languageCode, String category, boolean isApproved) {
        this.canonicalName = canonicalName;
        this.normalizedName = normalizedName;
        this.description = description;
        this.languageCode = languageCode != null ? languageCode : "en";
        this.category = category;
        this.isApproved = isApproved;
    }
}

