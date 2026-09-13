package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("video")
@Getter
@Setter
public class VideoItem extends FeedItem {
    private String thumbnail;
    private String videoUrl;
    private String duration;
}
