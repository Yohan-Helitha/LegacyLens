package lk.ac.sliit.legacylens.learning.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJob;
import lk.ac.sliit.legacylens.learning.ai.job.GenerationJobRepository;
import lk.ac.sliit.legacylens.learning.ai.job.JobStatus;
import lk.ac.sliit.legacylens.learning.ai.prompt.PromptBuilder;
import lk.ac.sliit.legacylens.learning.ai.prompt.PromptOptions;
import lk.ac.sliit.legacylens.learning.ai.provider.AiContentGenerator;
import lk.ac.sliit.legacylens.learning.ai.provider.GeneratedContentResult;
import lk.ac.sliit.legacylens.learning.ai.provider.GenerationPrompt;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContentProvider;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedContentValidator;
import lk.ac.sliit.legacylens.learning.ai.validation.GeneratedStudySet;
import lk.ac.sliit.legacylens.learning.ai.validation.ValidationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class StudyGenerationService {

	private static final Logger log = LoggerFactory.getLogger(StudyGenerationService.class);

	private final GenerationJobRepository generationJobRepository;
	private final SourceContentProvider sourceContentProvider;
	private final PromptBuilder promptBuilder;
	private final AiContentGenerator aiContentGenerator;
	private final GeneratedContentValidator contentValidator;
	private final StudyCacheService studyCacheService;
	private final GenerationQuotaService quotaService;
	private final ObjectMapper objectMapper;
	private final int maxSelectedItems;
	private final int promptVersion;

	public StudyGenerationService(
			GenerationJobRepository generationJobRepository,
			SourceContentProvider sourceContentProvider,
			PromptBuilder promptBuilder,
			AiContentGenerator aiContentGenerator,
			GeneratedContentValidator contentValidator,
			StudyCacheService studyCacheService,
			GenerationQuotaService quotaService,
			ObjectMapper objectMapper,
			@Value("${app.learning.builder.max-selected-items:5}") int maxSelectedItems,
			@Value("${app.ai.prompt-version:1}") int promptVersion) {
		this.generationJobRepository = generationJobRepository;
		this.sourceContentProvider = sourceContentProvider;
		this.promptBuilder = promptBuilder;
		this.aiContentGenerator = aiContentGenerator;
		this.contentValidator = contentValidator;
		this.studyCacheService = studyCacheService;
		this.quotaService = quotaService;
		this.objectMapper = objectMapper;
		this.maxSelectedItems = maxSelectedItems > 0 ? maxSelectedItems : 5;
		this.promptVersion = promptVersion > 0 ? promptVersion : 1;
	}

	public GenerationJob startJob(UUID userId, List<String> sourceIds, PromptOptions options) {
		List<String> validIds = null;
		List<SourceContent> sources = null;
		GenerationJob job = null;
		GenerationJob savedJob = null;
		String requestedArtifacts = null;

		quotaService.checkQuota(userId);

		if (sourceIds == null || sourceIds.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one source item must be selected");
		}

		if (sourceIds.size() > maxSelectedItems) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Cannot select more than " + maxSelectedItems + " source items"
			);
		}

		validIds = new ArrayList<>(sourceIds);
		sources = sourceContentProvider.findApprovedByIds(validIds);
		if (sources.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "None of the selected source items were found");
		}

		requestedArtifacts = buildArtifactsSummary(options);

		job = new GenerationJob();
		job.setOwnerUserId(userId);
		job.setStatus(JobStatus.QUEUED);
		job.setSourceContentIds(String.join(",", validIds));
		job.setRequestedArtifacts(requestedArtifacts);

		savedJob = generationJobRepository.save(job);

		executeJobAsync(savedJob.getId(), validIds, options);

		return savedJob;
	}

	@Async
	public void executeJobAsync(Long jobId, List<String> sourceIds, PromptOptions options) {
		GenerationJob job = generationJobRepository.findById(jobId).orElse(null);
		String cacheKey = null;
		Optional<GeneratedStudySet> cached = Optional.empty();

		if (job == null) {
			log.warn("Job with id {} not found for execution", jobId);
			return;
		}

		job.setStatus(JobStatus.RUNNING);
		generationJobRepository.save(job);

		cacheKey = studyCacheService.computeCacheKey(sourceIds, options, promptVersion);
		cached = studyCacheService.get(cacheKey);

		if (cached.isPresent()) {
			handleCacheHit(job, cached.get());
			return;
		}

		generateAndValidate(job, sourceIds, options, cacheKey);
	}

	public GenerationJob getJob(UUID userId, Long jobId) {
		GenerationJob job = generationJobRepository.findByIdAndOwnerUserId(jobId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Generation job not found"));

		return job;
	}

	public void deleteJob(UUID userId, Long jobId) {
		GenerationJob job = getJob(userId, jobId);

		generationJobRepository.delete(job);
	}

	private void handleCacheHit(GenerationJob job, GeneratedStudySet studySet) {
		try {
			String json = objectMapper.writeValueAsString(studySet);

			job.setGeneratedJson(json);
			job.setStatus(JobStatus.SUCCEEDED);
			job.setLatencyMs(0L);
			job.setInputTokens(0);
			job.setOutputTokens(0);
			job.setCompletedAt(Instant.now());

			generationJobRepository.save(job);
			log.info("Generation job {} completed using cached study set", job.getId());
		} catch (Exception ex) {
			log.error("Failed to serialize cached study set for job {}: {}", job.getId(), ex.getMessage());
			job.setStatus(JobStatus.FAILED);
			job.setFailureReason("Failed to load cached content");
			job.setCompletedAt(Instant.now());
			generationJobRepository.save(job);
		}
	}

	private void generateAndValidate(GenerationJob job, List<String> sourceIds, PromptOptions options, String cacheKey) {
		try {
			List<SourceContent> sources = sourceContentProvider.findApprovedByIds(sourceIds);
			GenerationPrompt prompt = promptBuilder.buildPrompt(sources, options);
			GeneratedContentResult genResult = aiContentGenerator.generate(prompt);
			ValidationResult valResult = contentValidator.validate(genResult.getRawJson(), sources, options);

			if (!valResult.isValid()) {
				job.setStatus(JobStatus.FAILED);
				job.setFailureReason(valResult.getFailureReason());
				job.setLatencyMs(genResult.getLatencyMs());
				job.setInputTokens(genResult.getInputTokens());
				job.setOutputTokens(genResult.getOutputTokens());
				job.setCompletedAt(Instant.now());

				generationJobRepository.save(job);
				log.warn("Job {} failed validation: {}", job.getId(), valResult.getFailureReason());
				return;
			}

			GeneratedStudySet validSet = valResult.getStudySet();
			String json = objectMapper.writeValueAsString(validSet);

			studyCacheService.put(cacheKey, validSet);

			job.setGeneratedJson(json);
			job.setStatus(JobStatus.SUCCEEDED);
			job.setLatencyMs(genResult.getLatencyMs());
			job.setInputTokens(genResult.getInputTokens());
			job.setOutputTokens(genResult.getOutputTokens());
			job.setCompletedAt(Instant.now());

			generationJobRepository.save(job);
			log.info("Job {} succeeded in {} ms (tokens in={}, out={})",
					job.getId(), genResult.getLatencyMs(), genResult.getInputTokens(), genResult.getOutputTokens());
		} catch (Exception ex) {
			log.error("Job {} execution encountered error: {}", job.getId(), ex.getMessage());
			job.setStatus(JobStatus.FAILED);
			job.setFailureReason(ex.getMessage() != null ? ex.getMessage() : "Unknown generation error");
			job.setCompletedAt(Instant.now());
			generationJobRepository.save(job);
		}
	}

	private String buildArtifactsSummary(PromptOptions options) {
		List<String> list = new ArrayList<>();
		String summary = null;

		if (options != null) {
			if (options.isIncludeFlashcards()) {
				list.add("FLASHCARDS");
			}
			if (options.isIncludeQuiz()) {
				list.add("QUIZ");
			}
			if (options.isIncludeMiniCourse()) {
				list.add("MINI_COURSE");
			}
			if (options.isIncludeCertificate()) {
				list.add("CERTIFICATE");
			}
		}

		summary = String.join(",", list);

		return summary;
	}
}
