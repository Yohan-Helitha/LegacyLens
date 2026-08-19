package lk.ac.sliit.legacylens.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Responsible only for creating and validating JWTs.
 * Knows nothing about HTTP, Spring Security context, or the database
 * (Single Responsibility) that's JwtAuthenticationFilter's job.
 */
@Component
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {

        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(UserRole::getRoleType)
                .map(RoleType::name)
                .collect(Collectors.toList());

        Date issuedAt = new Date();
        Date expiry = new Date(issuedAt.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("phoneNumber", user.getPhoneNumber())
                .claim("roles", roleNames)
                .issuedAt(issuedAt)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);

            return claims.getExpiration().after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }
}
