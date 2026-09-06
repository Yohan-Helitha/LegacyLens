package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "featured_keepers")
@Getter
@Setter
public class FeaturedKeeper {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String title;
    private String tag;
    
    @Column(length = 1000)
    private String quote;
    
    private String avatarUrl;
    
    private Integer likesCount;
}
