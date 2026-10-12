package lk.ac.sliit.legacylens.learning.ai;

import lk.ac.sliit.legacylens.learning.ai.job.GenerationJobRepository;
import lk.ac.sliit.legacylens.learning.ai.service.GenerationQuotaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class GenerationQuotaServiceTest {

	private GenerationJobRepository jobRepository;
	private GenerationQuotaService quotaService;
	private Clock fixedClock;
	private final UUID userId = UUID.randomUUID();

	@BeforeEach
	void setUp() {
		jobRepository = mock(GenerationJobRepository.class);
		fixedClock = Clock.fixed(Instant.parse("2026-10-12T10:00:00Z"), ZoneId.of("Asia/Colombo"));
		quotaService = new GenerationQuotaService(jobRepository, fixedClock, 5, "Asia/Colombo");
	}

	@Test
	@DisplayName("Returns correct remaining quota when under cap")
	void testRemainingQuotaUnderCap() {
		when(jobRepository.countByOwnerUserIdAndCreatedAtAfter(eq(userId), any(Instant.class)))
				.thenReturn(2L);

		int remaining = quotaService.getRemainingQuota(userId);

		assertEquals(3, remaining);
		assertDoesNotThrow(() -> quotaService.checkQuota(userId));
	}

	@Test
	@DisplayName("Throws 429 TOO_MANY_REQUESTS when quota is reached or exceeded")
	void testQuotaExceededThrows() {
		when(jobRepository.countByOwnerUserIdAndCreatedAtAfter(eq(userId), any(Instant.class)))
				.thenReturn(5L);

		int remaining = quotaService.getRemainingQuota(userId);

		assertEquals(0, remaining);
		ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> quotaService.checkQuota(userId));
		assertEquals(429, ex.getStatusCode().value());
	}
}
