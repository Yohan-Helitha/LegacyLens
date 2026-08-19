package lk.ac.sliit.legacylens.auth.security;

import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Loads a User for Spring Security given the user's UUID as a string.
 *
 * Note: the "username" here is the JWT subject (user id), not the phone
 * number — this service is only ever called by JwtAuthenticationFilter
 * after a token has already been cryptographically validated.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        UUID id = UUID.fromString(userId);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        return new CustomUserDetails(user);
    }
}
