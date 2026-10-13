package lk.ac.sliit.legacylens.learning.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.learning.ai.dto.CreateStudyJobRequest;
import lk.ac.sliit.legacylens.learning.ai.dto.StudyJobResponse;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJob;
import lk.ac.sliit.legacylens.learning.ai.prompt.PromptOptions;
import lk.ac.sliit.legacylens.learning.ai.service.GenerationQuotaService;
import lk.ac.sliit.legacylens.learning.ai.service.StudyGenerationService;
import lk.ac.sliit.legacylens.learning.ai.service.StudySetService;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContentProvider;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContentSummary;
import lk.ac.sliit.legacylens.learning.ai.source.SourceSearchCriteria;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedStudySet;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/learning/builder")
public class StudyBuilderController {

	private final SourceContentProvider sourceContentProvider;
	private final StudyGenerationService studyGenerationService;
	private final StudySetService studySetService;
	private final GenerationQuotaService quotaService;
	private final ObjectMapper objectMapper;

	public StudyBuilderController(
			SourceContentProvider sourceContentProvider,
			StudyGenerationService studyGenerationService,
			StudySetService studySetService,
			GenerationQuotaService quotaService,
			ObjectMapper objectMapper) {
		this.sourceContentProvider = sourceContentProvider;
		this.studyGenerationService = studyGenerationService;
		this.studySetService = studySetService;
		this.quotaService = quotaService;
		this.objectMapper = objectMapper;
	}

	@GetMapping("/content")
	public ResponseEntity<ApiResponse<List<SourceContentSummary>>> searchContent(
			@AuthenticationPrincipal CustomUserDetails principal,
			@RequestParam(required = false) String query,
			@RequestParam(required = false) String region,
			@RequestParam(required = false) String occupation,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		SourceSearchCriteria criteria = SourceSearchCriteria.builder()
				.query(query)
				.region(region)
				.occupation(occupation)
				.page(page)
				.size(size)
				.build();
		List<SourceContentSummary> summaries = sourceContentProvider.search(criteria);

		return ResponseEntity.ok(ApiResponse.ok(summaries));
	}

	@GetMapping("/quota")
	public ResponseEntity<ApiResponse<Map<String, Object>>> getQuota(
			@AuthenticationPrincipal CustomUserDetails principal) {
		UUID userId = principal.getUser().getId();
		int dailyLimit = quotaService.getDailyLimit();
		int remainingQuota = quotaService.getRemainingQuota(userId);
		Map<String, Object> data = Map.of(
				"dailyLimit", dailyLimit,
				"remainingQuota", remainingQuota
		);

		return ResponseEntity.ok(ApiResponse.ok(data));
	}

	@PostMapping("/jobs")
	public ResponseEntity<ApiResponse<StudyJobResponse>> createJob(
			@AuthenticationPrincipal CustomUserDetails principal,
			@Valid @RequestBody CreateStudyJobRequest request) {
		UUID userId = principal.getUser().getId();
		PromptOptions options = PromptOptions.builder()
				.includeQuiz(request.isIncludeQuiz())
				.includeFlashcards(request.isIncludeFlashcards())
				.includeMiniCourse(request.isIncludeMiniCourse())
				.includeCertificate(request.isIncludeCertificate())
				.quizQuestionCount(request.getQuizQuestionCount() != null ? request.getQuizQuestionCount() : 5)
				.flashcardCount(request.getFlashcardCount() != null ? request.getFlashcardCount() : 5)
				.courseLessonCount(request.getCourseLessonCount() != null ? request.getCourseLessonCount() : 2)
				.build();
		GenerationJob job = studyGenerationService.startJob(userId, request.getSourceIds(), options);
		StudyJobResponse response = toJobResponse(job);

		return ResponseEntity.status(HttpStatus.ACCEPTED)
				.body(ApiResponse.ok("AI Study Builder job initiated", response));
	}

	@GetMapping("/jobs/{jobId}")
	public ResponseEntity<ApiResponse<StudyJobResponse>> getJob(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long jobId) {
		UUID userId = principal.getUser().getId();
		GenerationJob job = studyGenerationService.getJob(userId, jobId);
		StudyJobResponse response = toJobResponse(job);

		return ResponseEntity.ok(ApiResponse.ok(response));
	}

	@PostMapping("/jobs/{jobId}/save")
	public ResponseEntity<ApiResponse<Map<String, Object>>> saveJob(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long jobId) {
		UUID userId = principal.getUser().getId();
		Long trackId = studySetService.saveStudySet(userId, jobId);
		Map<String, Object> data = Map.of("trackId", trackId);

		return ResponseEntity.ok(ApiResponse.ok("Study set saved successfully", data));
	}

	@DeleteMapping("/jobs/{jobId}")
	public ResponseEntity<ApiResponse<Void>> deleteJob(
			@AuthenticationPrincipal CustomUserDetails principal,
			@PathVariable Long jobId) {
		UUID userId = principal.getUser().getId();

		studyGenerationService.deleteJob(userId, jobId);

		return ResponseEntity.ok(ApiResponse.ok("Job discarded", null));
	}

	private StudyJobResponse toJobResponse(GenerationJob job) {
		List<String> sourceIds = job.getSourceContentIds() != null && !job.getSourceContentIds().isBlank()
				? Arrays.asList(job.getSourceContentIds().split(","))
				: List.of();
		GeneratedStudySet preview = null;
		StudyJobResponse response = null;

		if (job.getGeneratedJson() != null && !job.getGeneratedJson().isBlank()) {
			try {
				preview = objectMapper.readValue(job.getGeneratedJson(), GeneratedStudySet.class);
			} catch (Exception ignored) {
			}
		}

		response = StudyJobResponse.builder()
				.jobId(job.getId())
				.status(job.getStatus())
				.failureReason(job.getFailureReason())
				.resultTrackId(job.getResultTrackId())
				.sourceContentIds(sourceIds)
				.requestedArtifacts(job.getRequestedArtifacts())
				.inputTokens(job.getInputTokens())
				.outputTokens(job.getOutputTokens())
				.latencyMs(job.getLatencyMs())
				.createdAt(job.getCreatedAt())
				.completedAt(job.getCompletedAt())
				.preview(preview)
				.build();

		return response;
	}
}
