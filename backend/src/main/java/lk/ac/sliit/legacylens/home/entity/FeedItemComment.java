package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "feed_item_comments")
@Getter
@Setter
public class FeedItemComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feed_item_id", nullable = false)
    private FeedItem feedItem;

    @Column(nullable = false)
    private String author;
    
    private String authorAvatar;

    @Column(nullable = false, length = 1000)
    private String text;

    private String timeAgo;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
