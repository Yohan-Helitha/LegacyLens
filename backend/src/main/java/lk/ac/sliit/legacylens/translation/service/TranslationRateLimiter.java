package lk.ac.sliit.legacylens.translation.service;

import lk.ac.sliit.legacylens.common.exception.TooManyRequestsException;
import lk.ac.sliit.legacylens.translation.config.TranslationProperties;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-user sliding-window limit on translation requests, so one account can't run up the Google bill. Kept in
 * memory: a restart simply resets the windows, which is fine for a cost guard.
 */
@Component
public class TranslationRateLimiter {

    private static final long WINDOW_MILLIS = 60_000L;

    private final TranslationProperties properties;
    private final Clock clock;
    private final Map<UUID, Deque<Long>> requestTimes = new ConcurrentHashMap<>();

    public TranslationRateLimiter(TranslationProperties properties) {
        this(properties, Clock.systemUTC());
    }

    TranslationRateLimiter(TranslationProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    /** Records one request for this user, or throws {@link TooManyRequestsException} if they're over the limit. */
    public void check(UUID userId) {
        long now = clock.millis();
        Deque<Long> times = requestTimes.computeIfAbsent(userId, id -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() >= WINDOW_MILLIS) {
                times.pollFirst();
            }
            if (times.size() >= properties.getRequestsPerMinute()) {
                throw new TooManyRequestsException("Too many translation requests. Please wait a moment and try again.");
            }
            times.addLast(now);
        }
    }
}
