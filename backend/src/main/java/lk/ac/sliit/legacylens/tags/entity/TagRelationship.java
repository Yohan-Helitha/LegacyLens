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
@Table(name = "tag_relationships",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_tag_rel_source_target_type",
                columnNames = {"source_tag_id", "target_tag_id", "relationship_type"}
        ),
        indexes = {
                @Index(name = "idx_tag_rel_source", columnList = "source_tag_id"),
                @Index(name = "idx_tag_rel_target", columnList = "target_tag_id"),
                @Index(name = "idx_tag_rel_type", columnList = "relationship_type")
        })
@Getter
@Setter
@NoArgsConstructor
public class TagRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "source_tag_id", nullable = false)
    private Tag sourceTag;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "target_tag_id", nullable = false)
    private Tag targetTag;

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship_type", nullable = false, length = 30)
    private RelationshipType relationshipType = RelationshipType.RELATED_TO;

    @Column(nullable = false)
    private Double weight = 1.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public TagRelationship(Tag sourceTag, Tag targetTag, RelationshipType relationshipType, Double weight) {
        this.sourceTag = sourceTag;
        this.targetTag = targetTag;
        this.relationshipType = relationshipType != null ? relationshipType : RelationshipType.RELATED_TO;
        this.weight = (weight != null && weight >= 0.0 && weight <= 1.0) ? weight : 1.0;
    }
}

