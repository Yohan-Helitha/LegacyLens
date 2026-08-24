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
 * Stores a curated "Word of the Day" entry to be displayed in the LegacyLens
 * Home screen. Each entry has a Sinhala script word, its romanised transliteration,
 * a short definition, and an optional extended cultural note.
 *
 * Only one entry is "active" per calendar day — the service picks the entry
 * whose {@code activeDate} equals today's date.  If no entry exists for today
 * the component falls back to a sensible hardcoded default.
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

    /** The word in Sinhala Unicode script, e.g. "ගොවියා" */
    @Column(name = "word", nullable = false, length = 100)
    private String word;

    /**
     * Romanised transliteration plus a brief parenthetical gloss,
     * e.g. "Goviya (Farmer)"
     */
    @Column(name = "transliteration", nullable = false, length = 200)
    private String transliteration;

    /** Short English definition shown on the card. */
    @Column(name = "definition", nullable = false, length = 500)
    private String definition;

    /**
     * Optional deeper cultural/historical context shown on expand
     * (future use). May be null.
     */
    @Column(name = "cultural_note", length = 1000)
    private String culturalNote;

    /**
     * The calendar date this entry should be shown as "Word of the Day".
     * Must be unique — one word per day.
     */
    @Column(name = "active_date", nullable = false, unique = true)
    private LocalDate activeDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
