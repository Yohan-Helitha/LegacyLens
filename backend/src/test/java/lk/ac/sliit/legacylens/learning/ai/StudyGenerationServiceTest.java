package lk.ac.sliit.legacylens.learning.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJob;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJobRepository;
import lk.ac.sliit.legacylens.learning.ai.job.JobStatus;
import lk.ac.sliit.legacylens.learning.ai.prompt.PromptBuilder;
import lk.ac.sliit.legacylens.learning.ai.prompt.PromptOptions;
import lk.ac.sliit.legacylens.learning.ai.prompt.StudySetPromptBuilder;
import lk.ac.sliit.legacylens.learning.ai.provider.GeneratedContentResult;
import lk.ac.sliit.legacylens.learning.ai.service.GenerationQuotaService;
import lk.ac.sliit.legacylens.learning.ai.service.StudyCacheService;
import lk.ac.sliit.legacylens.learning.ai.service.StudyGenerationService;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;
import lk.ac.sliit.legacylens.learning.ai.validation.DefaultGeneratedContentValidator;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedContentValidator;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedStudySet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StudyGenerationServiceTest {

	private GenerationJobRepository jobRepository;
	private FakeSourceContentProvider sourceProvider;
	private FakeAiContentGenerator aiGenerator;
	private PromptBuilder promptBuilder;
	private GeneratedContentValidator validator;
	private StudyCacheService cacheService;
	private GenerationQuotaService quotaService;
	private ObjectMapper objectMapper;
	private StudyGenerationService service;

	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		jobRepository = mock(GenerationJobRepository.class);
		sourceProvider = new FakeSourceContentProvider();
		aiGenerator = new FakeAiContentGenerator();
		promptBuilder = new StudySetPromptBuilder(12000, 2500, 45);
		objectMapper = new ObjectMapper();
		validator = new DefaultGeneratedContentValidator(objectMapper, 1);
		cacheService = new StudyCacheService();
		quotaService = mock(GenerationQuotaService.class);

		service = new StudyGenerationService(
				jobRepository,
				sourceProvider,
				promptBuilder,
				aiGenerator,
				validator,
				cacheService,
				quotaService,
				objectMapper,
				5,
				1
		);
	}

	@Test
	@DisplayName("Rejects generation when no sources are selected")
	void testRejectEmptySources() {
		PromptOptions options = PromptOptions.builder().build();

		ResponseStatusException ex = assertThrows(ResponseStatusException.class,
				() -> service.startJob(userId, List.of(), options));
		assertEquals(400, ex.getStatusCode().value());
	}

	@Test
	@DisplayName("Rejects generation when exceeding max allowed source items (5)")
	void testRejectExceedingMaxSources() {
		PromptOptions options = PromptOptions.builder().build();
		List<String> tooMany = List.of("1", "2", "3", "4", "5", "6");

		ResponseStatusException ex = assertThrows(ResponseStatusException.class,
				() -> service.startJob(userId, tooMany, options));
		assertEquals(400, ex.getStatusCode().value());
	}

	@Test
	@DisplayName("Executes generation and updates job status to SUCCEEDED")
	void testSuccessfulGenerationFlow() {
		SourceContent source = SourceContent.builder()
				.id("s1")
				.title("Traditional Masks")
				.text("Carvers in Ambalangoda use kaduru wood.")
				.build();
		sourceProvider.addContent(source);

		String validJson = """
			{
			  "courseTitle": "Ambalangoda Masks",
			  "courseDescription": "Mask crafts",
			  "flashcards": [
			    { "word": "kaduru", "meaning": "Light wood", "evidence": "use kaduru wood", "sourceContentId": "s1" }
			  ]
			}
			""";
		aiGenerator.setCannedResult(GeneratedContentResult.builder()
				.rawJson(validJson)
				.inputTokens(120)
				.outputTokens(80)
				.latencyMs(1200L)
				.modelName("gemini-1.5-flash")
				.build());

		GenerationJob job = new GenerationJob();
		job.setId(10L);
		job.setOwnerUserId(userId);
		job.setStatus(JobStatus.QUEUED);

		when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
		when(jobRepository.save(any(GenerationJob.class))).thenAnswer(inv -> inv.getArgument(0));

		PromptOptions options = PromptOptions.builder().includeFlashcards(true).includeQuiz(false).build();
		service.executeJobAsync(10L, List.of("s1"), options);

		assertEquals(JobStatus.SUCCEEDED, job.getStatus());
		assertNotNull(job.getGeneratedJson());
		assertEquals(120, job.getInputTokens());
		assertEquals(80, job.getOutputTokens());
		assertEquals(1200L, job.getLatencyMs());
		assertNotNull(job.getCompletedAt());
	}

	@Test
	@DisplayName("Completes directly from cache without calling AI generator on cache hit")
	void testCacheHitSkipsAi() {
		PromptOptions options = PromptOptions.builder().includeFlashcards(true).includeQuiz(false).build();
		String cacheKey = cacheService.computeCacheKey(List.of("s1"), options, 1);
		GeneratedStudySet cachedSet = GeneratedStudySet.builder()
				.courseTitle("Cached Track")
				.build();
		cacheService.put(cacheKey, cachedSet);

		GenerationJob job = new GenerationJob();
		job.setId(20L);
		job.setOwnerUserId(userId);
		job.setStatus(JobStatus.QUEUED);

		when(jobRepository.findById(20L)).thenReturn(Optional.of(job));
		when(jobRepository.save(any(GenerationJob.class))).thenAnswer(inv -> inv.getArgument(0));

		service.executeJobAsync(20L, List.of("s1"), options);

		assertEquals(JobStatus.SUCCEEDED, job.getStatus());
		assertEquals(0, aiGenerator.getCallCount());
		assertEquals(0L, job.getLatencyMs());
	}

	@Test
	@DisplayName("Throws 429 Too Many Requests when user exceeds daily generation quota")
	void testQuotaExceededThrows429() {
		PromptOptions options = PromptOptions.builder().includeFlashcards(true).build();
		doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS, "Daily limit reached"))
				.when(quotaService).checkQuota(userId);

		ResponseStatusException ex = assertThrows(ResponseStatusException.class,
				() -> service.startJob(userId, List.of("s1"), options));

		assertEquals(429, ex.getStatusCode().value());
	}

	@Test
	@DisplayName("Silently drops unapproved or nonexistent content IDs from generation")
	void testUnapprovedContentIdSilentlyDropped() {
		SourceContent approvedSource = SourceContent.builder()
				.id("s1")
				.title("Traditional Masks")
				.text("Carvers in Ambalangoda use kaduru wood.")
				.build();
		sourceProvider.addContent(approvedSource);

		// "unapproved_99" is not added to sourceProvider
		List<SourceContent> loaded = sourceProvider.findApprovedByIds(List.of("s1", "unapproved_99"));

		assertEquals(1, loaded.size());
		assertEquals("s1", loaded.get(0).getId());
	}

	@Test
	@DisplayName("Marks job as FAILED when AI generator times out or throws an error")
	void testGeneratorTimingOutMarksJobFailed() {
		SourceContent source = SourceContent.builder()
				.id("s1")
				.title("Traditional Masks")
				.text("Carvers in Ambalangoda use kaduru wood.")
				.build();
		sourceProvider.addContent(source);

		aiGenerator.setCannedException(new RuntimeException("Gateway Timeout: AI provider did not respond within deadline"));

		GenerationJob job = new GenerationJob();
		job.setId(30L);
		job.setOwnerUserId(userId);
		job.setStatus(JobStatus.QUEUED);

		when(jobRepository.findById(30L)).thenReturn(Optional.of(job));
		when(jobRepository.save(any(GenerationJob.class))).thenAnswer(inv -> inv.getArgument(0));

		PromptOptions options = PromptOptions.builder().includeFlashcards(true).includeQuiz(false).build();
		service.executeJobAsync(30L, List.of("s1"), options);

		assertEquals(JobStatus.FAILED, job.getStatus());
		assertNotNull(job.getFailureReason());
		assertTrue(job.getFailureReason().contains("Timeout") || job.getFailureReason().contains("AI provider"));
	}

	@Test
	@DisplayName("Learner A cannot read or delete Learner B's generation job")
	void testLearnerACannotReadOrDeleteLearnerBJob() {
		UUID learnerB = UUID.randomUUID();
		GenerationJob jobOfLearnerB = new GenerationJob();
		jobOfLearnerB.setId(40L);
		jobOfLearnerB.setOwnerUserId(learnerB);

		when(jobRepository.findByIdAndOwnerUserId(40L, userId)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> service.getJob(userId, 40L));
		assertThrows(ResponseStatusException.class, () -> service.deleteJob(userId, 40L));
	}
}
