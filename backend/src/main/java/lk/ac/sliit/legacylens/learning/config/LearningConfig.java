package lk.ac.sliit.legacylens.learning.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
@EnableAsync
public class LearningConfig {

	@Bean
	@ConditionalOnMissingBean
	public Clock clock() {
		ZoneId zoneId = ZoneId.of("Asia/Colombo");

		Clock systemClock = Clock.system(zoneId);

		return systemClock;
	}
}
