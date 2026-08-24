package lk.ac.sliit.legacylens.map.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "landmarks")
@Getter
@Setter
@NoArgsConstructor
public class Landmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private String name;

    @Column(length = 1000)
    private String description;

    private Double longitude;
    private Double latitude;

    private String icon;
    private String image;
    private String modelUrl;
    private String region;

    @OneToOne(mappedBy = "landmark", cascade = CascadeType.ALL)
    private Badge badge;

    @OneToMany(mappedBy = "landmark", cascade = CascadeType.ALL)
    private List<Quest> quests = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
