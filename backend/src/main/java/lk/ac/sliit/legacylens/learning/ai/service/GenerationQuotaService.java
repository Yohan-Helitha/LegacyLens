package lk.ac.sliit.legacylens.learning.ai.service;

import lk.ac.sliit.legacylens.learning.ai.job.GenerationJobRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

@Service
public class GenerationQuotaService {

	private final GenerationJobRepository generationJobRepository;
	private final Clock clock;
	private final int dailyLimit;
	private final ZoneId zoneId;

	public GenerationQuotaService(
			GenerationJobRepository generationJobRepository,
			Clock clock,
			@Value("${app.learning.builder.daily-generation-limit:5}") int dailyLimit,
			@Value("${app.learning.timezone:Asia/Colombo}") String timezone) {
		this.generationJobRepository = generationJobRepository;
		this.clock = clock;
		this.dailyLimit = dailyLimit > 0 ? dailyLimit : 5;
		this.zoneId = ZoneId.of(timezone);
	}

	public void checkQuota(UUID userId) {
		int remaining = getRemainingQuota(userId);

		if (remaining <= 0) {
			throw new ResponseStatusException(
					HttpStatus.TOO_MANY_REQUESTS,
					"Daily AI generation limit reached (" + dailyLimit + " sets per day). Please try again tomorrow."
			);
		}
	}

	public int getRemainingQuota(UUID userId) {
		Instant startOfDay = LocalDate.now(clock)
				.atStartOfDay(zoneId)
				.toInstant();
		long usedToday = generationJobRepository.countByOwnerUserIdAndCreatedAtAfter(userId, startOfDay);
		int remaining = Math.max(0, dailyLimit - (int) usedToday);

		return remaining;
	}

	public int getDailyLimit() {
		return dailyLimit;
	}
}
