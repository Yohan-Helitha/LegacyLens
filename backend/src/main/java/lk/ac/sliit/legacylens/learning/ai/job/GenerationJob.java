package lk.ac.sliit.legacylens.learning.ai.job;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "generation_jobs")
public class GenerationJob {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "owner_user_id", nullable = false)
	private UUID ownerUserId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private JobStatus status = JobStatus.QUEUED;

	@Column(name = "requested_artifacts", columnDefinition = "TEXT")
	private String requestedArtifacts;

	@Column(name = "source_content_ids", columnDefinition = "TEXT")
	private String sourceContentIds;

	@Column(name = "failure_reason", columnDefinition = "TEXT")
	private String failureReason;

	@Column(name = "result_track_id")
	private Long resultTrackId;

	@Column(name = "generated_json", columnDefinition = "TEXT")
	private String generatedJson;

	@Column(name = "input_tokens")
	private Integer inputTokens;

	@Column(name = "output_tokens")
	private Integer outputTokens;

	@Column(name = "latency_ms")
	private Long latencyMs;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	@PrePersist
	protected void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public GenerationJob() {
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

	public JobStatus getStatus() {
		return status;
	}

	public void setStatus(JobStatus status) {
		this.status = status;
	}

	public String getRequestedArtifacts() {
		return requestedArtifacts;
	}

	public void setRequestedArtifacts(String requestedArtifacts) {
		this.requestedArtifacts = requestedArtifacts;
	}

	public String getSourceContentIds() {
		return sourceContentIds;
	}

	public void setSourceContentIds(String sourceContentIds) {
		this.sourceContentIds = sourceContentIds;
	}

	public String getFailureReason() {
		return failureReason;
	}

	public void setFailureReason(String failureReason) {
		this.failureReason = failureReason;
	}

	public Long getResultTrackId() {
		return resultTrackId;
	}

	public void setResultTrackId(Long resultTrackId) {
		this.resultTrackId = resultTrackId;
	}

	public String getGeneratedJson() {
		return generatedJson;
	}

	public void setGeneratedJson(String generatedJson) {
		this.generatedJson = generatedJson;
	}

	public Integer getInputTokens() {
		return inputTokens;
	}

	public void setInputTokens(Integer inputTokens) {
		this.inputTokens = inputTokens;
	}

	public Integer getOutputTokens() {
		return outputTokens;
	}

	public void setOutputTokens(Integer outputTokens) {
		this.outputTokens = outputTokens;
	}

	public Long getLatencyMs() {
		return latencyMs;
	}

	public void setLatencyMs(Long latencyMs) {
		this.latencyMs = latencyMs;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}
}
