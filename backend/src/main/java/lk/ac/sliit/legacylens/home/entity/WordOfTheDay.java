package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Stores a curated "Word of the Day" entry displayed on the LegacyLens
 * Home screen. Maps to the existing {@code word_of_the_day} table.
 * Only {@code status} is newly added — all other columns already exist.
 */
@Entity
@Table(
        name = "word_of_the_day",
        indexes = @Index(name = "idx_word_active_date", columnList = "active_date")
)
@Getter
@Setter
@NoArgsConstructor
public class WordOfTheDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The word in its native script, e.g. "සාමූහිකත්වය". */
    @Column(name = "word", nullable = false, length = 100)
    private String word;

    /** Romanised transliteration / phonetic guide. */
    @Column(name = "transliteration", nullable = false, length = 200)
    private String transliteration;

    /** Short English definition shown on the mobile card. */
    @Column(name = "definition", nullable = false, length = 500)
    private String definition;

    /** Grammatical category: Noun, Verb, Adjective, Adverb, Idiom / Phrase. */
    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    /** Filename of the elder audio pronunciation clip. */
    @Column(name = "audio_filename", length = 255)
    private String audioFilename;

    /**
     * The calendar date this entry is shown as "Word of the Day".
     * Unique — one word per day.
     */
    @Column(name = "active_date", nullable = false, unique = true)
    private LocalDate activeDate;

    /**
     * Publication status: Draft | Scheduled | Published.
     * Uses a DB-level DEFAULT so Hibernate ddl-auto=update can safely
     * ADD COLUMN on the existing table without breaking existing rows.
     */
    @Column(name = "status", length = 20,
            columnDefinition = "VARCHAR(20) DEFAULT 'Draft'")
    private String status = "Draft";

    @Column(name = "language", length = 20, nullable = false,
            columnDefinition = "VARCHAR(20) DEFAULT 'Sinhala'")
    private String language = "Sinhala";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
