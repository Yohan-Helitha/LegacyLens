package lk.ac.sliit.legacylens.home.entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Entity
@DiscriminatorValue("audio")
@Getter
@Setter
public class AudioItem extends FeedItem {
    private String duration;
    private String topic;
    private String avatar;
    
    @ElementCollection
    @CollectionTable(name = "audio_item_bars", joinColumns = @JoinColumn(name = "audio_item_id"))
    @Column(name = "bar_value")
    private List<Integer> bars;
}
