package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("blog")
@Getter
@Setter
public class BlogItem extends FeedItem {
    @Column(length = 1000)
    private String excerpt;
    private String thumbnail;
    private String readTime;
}
