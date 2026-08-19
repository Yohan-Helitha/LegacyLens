package lk.ac.sliit.legacylens.auth.security;

import io.jsonwebtoken.Claims;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JwtService has no collaborators to mock — it's pure token logic — so these
 * are plain unit tests rather than Mockito-based ones. A 32+ char test
 * secret is required since HS256 needs a 256-bit key.
 */
class JwtServiceTest {

    private static final String TEST_SECRET = "test-secret-key-must-be-at-least-32-chars-long";

    @Test
    void generateToken_thenParseClaims_roundTripsCorrectly() {
        JwtService jwtService = new JwtService(TEST_SECRET, 3_600_000L);
        User user = buildUserWithRole(RoleType.ELDER);

        String token = jwtService.generateToken(user);
        Claims claims = jwtService.parseClaims(token);

        assertThat(jwtService.extractUserId(token)).isEqualTo(user.getId().toString());
        assertThat(claims.get("phoneNumber")).isEqualTo(user.getPhoneNumber());
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_alreadyExpiredToken_returnsFalse() {
        // Negative expiration puts the "expires at" timestamp in the past
        // the moment the token is minted — deterministic, no need to sleep.
        JwtService jwtService = new JwtService(TEST_SECRET, -1000L);
        User user = buildUserWithRole(RoleType.GENERAL_USER);

        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_malformedToken_returnsFalse() {
        JwtService jwtService = new JwtService(TEST_SECRET, 3_600_000L);

        assertThat(jwtService.isTokenValid("not-a-real-token")).isFalse();
    }

    private User buildUserWithRole(RoleType roleType) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setPhoneNumber("+94771234567");

        List<UserRole> roles = new ArrayList<>();
        UserRole role = new UserRole();
        role.setUser(user);
        role.setRoleType(roleType);
        role.setStatus(RoleStatus.ACTIVE);
        roles.add(role);
        user.setRoles(roles);

        return user;
    }
}
