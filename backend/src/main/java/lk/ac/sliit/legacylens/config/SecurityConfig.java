package lk.ac.sliit.legacylens.config;

import lk.ac.sliit.legacylens.auth.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security configuration.
 * Auth endpoints are public.
 * All other API endpoints require a valid JWT.
 * Sessions are stateless (JWT based).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — no token required. Cities must be public
                // too: the signup form needs the list before the user has an
                // account or a token. /uploads/** is served straight to
                // <Video>/<Audio> elements in the app, which can't attach an
                // Authorization header, so uploaded media is deliberately
                // unauthenticated (obscurity via random filenames only).
                .requestMatchers("/api/auth/**", "/api/cities/**", "/uploads/**").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            // Without this, JwtAuthenticationFilter is never invoked and every
            // Bearer-token request falls through as anonymous — see the class's
            // own javadoc; it exists specifically to populate SecurityContext.
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * BCrypt password encoder used to hash PINs before storing them.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
