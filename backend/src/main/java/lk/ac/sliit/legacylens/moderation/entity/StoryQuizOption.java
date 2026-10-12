package lk.ac.sliit.legacylens.moderation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "story_quiz_options", indexes = {
        @Index(name = "idx_quiz_options_quiz_id", columnList = "quiz_id")
})
@Getter
@Setter
@NoArgsConstructor
public class StoryQuizOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private StoryQuiz quiz;

    @Column(name = "option_key", length = 10, nullable = false)
    private String optionKey; // e.g. "A", "B", "C", "D"

    @Column(name = "option_text", columnDefinition = "TEXT", nullable = false)
    private String optionText;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_correct", nullable = false)
    private boolean correct = false;
}
