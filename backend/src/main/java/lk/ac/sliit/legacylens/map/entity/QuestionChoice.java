package lk.ac.sliit.legacylens.map.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "question_choices")
@Getter
@Setter
@NoArgsConstructor
public class QuestionChoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;
    private String icon;
    private String image;
    private boolean isCorrect;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;
}
