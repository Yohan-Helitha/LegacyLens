package lk.ac.sliit.legacylens.translation;

import lk.ac.sliit.legacylens.common.exception.TooManyRequestsException;
import lk.ac.sliit.legacylens.translation.config.TranslationProperties;
import lk.ac.sliit.legacylens.translation.controller.TranslationController;
import lk.ac.sliit.legacylens.translation.provider.GoogleTranslationProvider;
import lk.ac.sliit.legacylens.translation.repository.TranslationCacheRepository;
import lk.ac.sliit.legacylens.translation.service.TranslationRateLimiter;
import lk.ac.sliit.legacylens.translation.service.TranslationService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The unit tests build these classes by hand, so they can't catch a Spring wiring mistake. This one lets
 * Spring construct the translation beans the way the running app does — it would have caught the
 * "No default constructor found" crash on startup when a class had two constructors.
 */
class TranslationWiringTest {

    /** Turns on @ConfigurationProperties binding, which Spring Boot does by itself in the real app. */
    @Configuration
    @EnableConfigurationProperties
    static class PropertyBinding {
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(RestClient.Builder.class, RestClient::builder)
            .withBean(TranslationCacheRepository.class, () -> Mockito.mock(TranslationCacheRepository.class))
            .withUserConfiguration(
                    PropertyBinding.class,
                    TranslationProperties.class,
                    TranslationRateLimiter.class,
                    GoogleTranslationProvider.class,
                    TranslationService.class,
                    TranslationController.class);

    @Test
    void everyTranslationBeanIsCreatedByTheContainer() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(TranslationController.class);
            assertThat(context).hasSingleBean(TranslationRateLimiter.class);
            assertThat(context).hasSingleBean(TranslationService.class);
        });
    }

    @Test
    void theContainerBuiltRateLimiterUsesTheConfiguredLimit() {
        runner.withPropertyValues("app.translate.requests-per-minute=2").run(context -> {
            TranslationRateLimiter limiter = context.getBean(TranslationRateLimiter.class);
            UUID user = UUID.randomUUID();

            limiter.check(user);
            limiter.check(user);
            assertThatThrownBy(() -> limiter.check(user)).isInstanceOf(TooManyRequestsException.class);
        });
    }
}
