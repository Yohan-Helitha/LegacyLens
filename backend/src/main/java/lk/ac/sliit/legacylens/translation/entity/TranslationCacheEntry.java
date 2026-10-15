package lk.ac.sliit.legacylens.translation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One machine translation already paid for. Keyed by a hash of the source text (not the text itself, so user
 * writing isn't duplicated here) plus the target language — translating the same story or comment again, for
 * any viewer, is then a free lookup.
 */
@Entity
@Table(
        name = "translation_cache",
        uniqueConstraints = @UniqueConstraint(name = "uk_translation_cache_hash_lang", columnNames = {"source_hash", "target_language"}),
        indexes = @Index(name = "idx_translation_cache_lookup", columnList = "target_language, source_hash"))
@Getter
@Setter
@NoArgsConstructor
public class TranslationCacheEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** SHA-256 (hex) of the trimmed source text. */
    @Column(name = "source_hash", nullable = false, length = 64)
    private String sourceHash;

    @Column(name = "target_language", nullable = false, length = 8)
    private String targetLanguage;

    @Column(name = "translated_text", nullable = false, columnDefinition = "TEXT")
    private String translatedText;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public TranslationCacheEntry(String sourceHash, String targetLanguage, String translatedText) {
        this.sourceHash = sourceHash;
        this.targetLanguage = targetLanguage;
        this.translatedText = translatedText;
    }
}
