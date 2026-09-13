package lk.ac.sliit.legacylens.map.entity;

import jakarta.persistence.*;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_quest_progress")
@Getter
@Setter
@NoArgsConstructor
public class UserQuestProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    private int currentQuestionIndex = 0;
    
    private boolean isCompleted = false;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastPlayedAt;
}
