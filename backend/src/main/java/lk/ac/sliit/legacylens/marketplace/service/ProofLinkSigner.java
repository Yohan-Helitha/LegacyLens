package lk.ac.sliit.legacylens.marketplace.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and checks the short-lived tokens behind verification-document links.
 *
 * The signing key is derived from the app secret but is NOT the login key, so a
 * link token can never be used as a login token (and vice versa) even though
 * both are JWTs.
 */
@Component
public class ProofLinkSigner {

    public static final Duration LIFETIME = Duration.ofMinutes(5);

    private static final String PURPOSE_CLAIM = "purpose";
    private static final String PURPOSE = "creator-proof";

    private final SecretKey key;

    public ProofLinkSigner(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(sha256("creator-proof-link:" + secret));
    }

    public String issue(UUID ownerId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(ownerId.toString())
                .claim(PURPOSE_CLAIM, PURPOSE)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + LIFETIME.toMillis()))
                .signWith(key)
                .compact();
    }

    /** The document owner the token was issued for, or empty if it is forged, expired or not a document link. */
    public Optional<UUID> verify(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            if (!PURPOSE.equals(claims.get(PURPOSE_CLAIM, String.class))) {
                return Optional.empty();
            }
            return Optional.of(UUID.fromString(claims.getSubject()));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private static byte[] sha256(String text) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
