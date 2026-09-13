package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "feed_items")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "item_type", discriminatorType = DiscriminatorType.STRING)
@Getter
@Setter
public abstract class FeedItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; 

    private String author;
    
    private String location;
    
    @ElementCollection
    @CollectionTable(name = "feed_item_tags", joinColumns = @JoinColumn(name = "feed_item_id"))
    @Column(name = "tag")
    private List<String> tags;

    @Column(name = "likes_count", nullable = false, columnDefinition = "integer default 0")
    private Integer likesCount = 0;

    @Column(name = "comments_count", nullable = false, columnDefinition = "integer default 0")
    private Integer commentsCount = 0;
}
