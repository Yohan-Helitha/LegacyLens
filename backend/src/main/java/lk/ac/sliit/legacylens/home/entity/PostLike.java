package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_likes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_identifier", "post_id"})
}, indexes = {
        @Index(name = "idx_post_likes_user", columnList = "user_identifier"),
        @Index(name = "idx_post_likes_post", columnList = "post_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_identifier", nullable = false, length = 120)
    private String userIdentifier;

    @Column(name = "post_id", nullable = false, length = 120)
    private String postId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public PostLike(String userIdentifier, String postId) {
        this.userIdentifier = userIdentifier;
        this.postId = postId;
        this.createdAt = LocalDateTime.now();
    }
}

