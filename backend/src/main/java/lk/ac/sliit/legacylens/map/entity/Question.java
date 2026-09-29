package lk.ac.sliit.legacylens.map.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String riddle;
    
    private String image;

    @ManyToOne
    @JoinColumn(name = "quest_id")
    private Quest quest;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL)
    private List<QuestionChoice> choices = new ArrayList<>();
}
