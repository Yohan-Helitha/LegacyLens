package lk.ac.sliit.legacylens.map.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quests")
@Getter
@Setter
@NoArgsConstructor
public class Quest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(length = 500)
    private String description;

    @ManyToOne
    @JoinColumn(name = "landmark_id")
    private Landmark landmark;

    @OneToMany(mappedBy = "quest", cascade = CascadeType.ALL)
    private List<Question> questions = new ArrayList<>();
}
