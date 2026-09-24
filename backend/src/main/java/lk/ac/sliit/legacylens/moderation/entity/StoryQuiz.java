package lk.ac.sliit.legacylens.moderation.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "story_quizzes", indexes = {
        @Index(name = "idx_story_quizzes_story_id", columnList = "story_id")
})
@Getter
@Setter
@NoArgsConstructor
public class StoryQuiz {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "story_id", columnDefinition = "uuid", nullable = false, unique = true)
    private UUID storyId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("optionKey ASC")
    private List<StoryQuizOption> options = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addOption(StoryQuizOption option) {
        options.add(option);
        option.setQuiz(this);
    }

    public void removeOption(StoryQuizOption option) {
        options.remove(option);
        option.setQuiz(null);
    }
}
