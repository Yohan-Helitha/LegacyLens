package lk.ac.sliit.legacylens.translation.service;

import lk.ac.sliit.legacylens.common.exception.TooManyRequestsException;
import lk.ac.sliit.legacylens.translation.config.TranslationProperties;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TranslationRateLimiterTest {

    /** A clock the test can move forward. */
    private static final class MutableClock extends Clock {
        private long millis = 1_000_000L;

        void advance(long ms) {
            millis += ms;
        }

        @Override public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return Instant.ofEpochMilli(millis); }
    }

    private static TranslationProperties limit(int perMinute) {
        TranslationProperties properties = new TranslationProperties();
        properties.setRequestsPerMinute(perMinute);
        return properties;
    }

    @Test
    void allowsUpToTheLimitThenBlocks() {
        MutableClock clock = new MutableClock();
        TranslationRateLimiter limiter = new TranslationRateLimiter(limit(3), clock);
        UUID user = UUID.randomUUID();

        assertThatCode(() -> {
            limiter.check(user);
            limiter.check(user);
            limiter.check(user);
        }).doesNotThrowAnyException();
        assertThatThrownBy(() -> limiter.check(user)).isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void theWindowSlidesSoARequestIsAllowedAgainAfterAMinute() {
        MutableClock clock = new MutableClock();
        TranslationRateLimiter limiter = new TranslationRateLimiter(limit(1), clock);
        UUID user = UUID.randomUUID();

        limiter.check(user);
        assertThatThrownBy(() -> limiter.check(user)).isInstanceOf(TooManyRequestsException.class);

        clock.advance(60_001);
        assertThatCode(() -> limiter.check(user)).doesNotThrowAnyException();
    }

    @Test
    void usersAreLimitedIndependently() {
        TranslationRateLimiter limiter = new TranslationRateLimiter(limit(1), new MutableClock());

        limiter.check(UUID.randomUUID());
        assertThatCode(() -> limiter.check(UUID.randomUUID())).doesNotThrowAnyException();
    }
}
