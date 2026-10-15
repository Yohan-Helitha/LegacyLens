package lk.ac.sliit.legacylens.auth.security;

import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Loads a User for Spring Security given the user's UUID as a string.
 *
 * Note: the "username" here is the JWT subject (user id), not the phone
 * number this service is only ever called by JwtAuthenticationFilter
 * after a token has already been cryptographically validated.
 *
 * @Transactional keeps a Hibernate session open for the whole method body —
 * a safety net for CustomUserDetails' constructor, which reads user.getRoles().
 * findByIdWithRoles() already fetches roles eagerly via JOIN FETCH, so this
 * is defense in depth: even if that query is ever swapped back to a plain
 * findById(), lazy loading still succeeds because the session is still open.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    /**
     * How long a loaded user is reused. Every request used to ask the database who the caller is - a full
     * round trip before any screen's own work began. A few seconds is long enough to cover the burst of calls a
     * screen makes, and short enough that a suspension or a new role still takes effect almost at once.
     */
    private static final long CACHE_MS = 20_000;
    private static final int CACHE_LIMIT = 500;

    private record Cached(UserDetails details, long expiresAt) { }

    private final java.util.concurrent.ConcurrentHashMap<UUID, Cached> cache = new java.util.concurrent.ConcurrentHashMap<>();

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        UUID id = UUID.fromString(userId);

        long now = System.currentTimeMillis();
        Cached hit = cache.get(id);
        if (hit != null && hit.expiresAt() > now) {
            return hit.details();
        }

        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        UserDetails details = new CustomUserDetails(user);
        if (cache.size() >= CACHE_LIMIT) {
            cache.values().removeIf(entry -> entry.expiresAt() <= now);
            if (cache.size() >= CACHE_LIMIT) {
                cache.clear();
            }
        }
        cache.put(id, new Cached(details, now + CACHE_MS));
        return details;
    }
}
