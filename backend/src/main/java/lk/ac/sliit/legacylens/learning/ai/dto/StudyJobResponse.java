package lk.ac.sliit.legacylens.learning.ai.dto;

import lk.ac.sliit.legacylens.learning.ai.job.JobStatus;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedStudySet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyJobResponse {

	private Long jobId;
	private JobStatus status;
	private String failureReason;
	private Long resultTrackId;
	private List<String> sourceContentIds;
	private String requestedArtifacts;
	private Integer inputTokens;
	private Integer outputTokens;
	private Long latencyMs;
	private Instant createdAt;
	private Instant completedAt;
	private GeneratedStudySet preview;
}
