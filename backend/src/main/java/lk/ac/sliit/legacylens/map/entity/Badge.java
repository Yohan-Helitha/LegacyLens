package lk.ac.sliit.legacylens.map.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "badges")
@Getter
@Setter
@NoArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String badgeCode;
    private String title;
    private String image;

    @OneToOne
    @JoinColumn(name = "landmark_id")
    private Landmark landmark;
}
