package lk.ac.sliit.legacylens.learning.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "study_set_attempts")
public class StudySetAttempt {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "owner_user_id", nullable = false)
	private UUID ownerUserId;

	@Column(name = "track_id", nullable = false)
	private Long trackId;

	@Column(name = "lesson_id")
	private Long lessonId;

	@Column(nullable = false)
	private Integer score;

	@Column(nullable = false)
	private Integer total;

	@Column(name = "xp_awarded", nullable = false)
	private Integer xpAwarded = 0;

	@Column(name = "taken_at", nullable = false, updatable = false)
	private Instant takenAt;

	@PrePersist
	protected void onCreate() {
		if (takenAt == null) {
			takenAt = Instant.now();
		}
	}

	public StudySetAttempt() {
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public UUID getOwnerUserId() {
		return ownerUserId;
	}

	public void setOwnerUserId(UUID ownerUserId) {
		this.ownerUserId = ownerUserId;
	}

	public Long getTrackId() {
		return trackId;
	}

	public void setTrackId(Long trackId) {
		this.trackId = trackId;
	}

	public Long getLessonId() {
		return lessonId;
	}

	public void setLessonId(Long lessonId) {
		this.lessonId = lessonId;
	}

	public Integer getScore() {
		return score;
	}

	public void setScore(Integer score) {
		this.score = score;
	}

	public Integer getTotal() {
		return total;
	}

	public void setTotal(Integer total) {
		this.total = total;
	}

	public Integer getXpAwarded() {
		return xpAwarded;
	}

	public void setXpAwarded(Integer xpAwarded) {
		this.xpAwarded = xpAwarded;
	}

	public Instant getTakenAt() {
		return takenAt;
	}

	public void setTakenAt(Instant takenAt) {
		this.takenAt = takenAt;
	}
}
