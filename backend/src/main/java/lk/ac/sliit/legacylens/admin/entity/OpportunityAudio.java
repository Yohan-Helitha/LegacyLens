package lk.ac.sliit.legacylens.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "opportunity_audios", uniqueConstraints = {
        @UniqueConstraint(name = "uk_opportunity_audios_audio_url", columnNames = "audio_url")
})
@Getter
@Setter
@NoArgsConstructor
public class OpportunityAudio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "knowledge_holder_id")
    private User knowledgeHolder;

    @Column(name = "elder_name", nullable = false, length = 150)
    private String elderName;

    @Column(name = "elder_avatar_url", length = 500)
    private String elderAvatarUrl;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(length = 100)
    private String location;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(length = 20)
    private String duration;

    @Column(name = "audio_url", nullable = false, length = 500)
    private String audioUrl;

    @Column(columnDefinition = "TEXT")
    private String topic;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private AudioReviewStatus status = AudioReviewStatus.UNLISTENED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

