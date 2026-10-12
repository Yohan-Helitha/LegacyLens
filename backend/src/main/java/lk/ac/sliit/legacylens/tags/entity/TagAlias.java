package lk.ac.sliit.legacylens.tags.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tag_aliases",
        indexes = {
                @Index(name = "idx_tag_aliases_normalized", columnList = "normalized_alias", unique = true),
                @Index(name = "idx_tag_aliases_tag_id", columnList = "tag_id")
        })
@Getter
@Setter
@NoArgsConstructor
public class TagAlias {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(nullable = false, length = 150)
    private String alias;

    @Column(name = "normalized_alias", nullable = false, unique = true, length = 150)
    private String normalizedAlias;

    @Column(name = "language_code", length = 20)
    private String languageCode = "en";

    @Enumerated(EnumType.STRING)
    @Column(name = "alias_type", length = 30)
    private AliasType aliasType = AliasType.SYNONYM;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public TagAlias(Tag tag, String alias, String normalizedAlias, String languageCode, AliasType aliasType) {
        this.tag = tag;
        this.alias = alias;
        this.normalizedAlias = normalizedAlias;
        this.languageCode = languageCode != null ? languageCode : "en";
        this.aliasType = aliasType != null ? aliasType : AliasType.SYNONYM;
    }
}

