package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.auth.security.JwtService;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ProofLinkSignerTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123456";

    private final ProofLinkSigner signer = new ProofLinkSigner(SECRET);

    @Test
    void aFreshToken_isTiedToItsOwner() {
        UUID owner = UUID.randomUUID();

        assertThat(signer.verify(signer.issue(owner))).contains(owner);
    }

    @Test
    void garbageAndTamperedTokens_areRejected() {
        String token = signer.issue(UUID.randomUUID());

        assertThat(signer.verify("not-a-token")).isEmpty();
        assertThat(signer.verify(token.substring(0, token.length() - 3) + "abc")).isEmpty();
    }

    @Test
    void aTokenSignedWithAnotherSecret_isRejected() {
        String foreign = new ProofLinkSigner("another-secret-another-secret-another-123456").issue(UUID.randomUUID());

        assertThat(signer.verify(foreign)).isEmpty();
    }

    @Test
    void aLoginToken_isNotAValidDocumentLink() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setPhoneNumber("0771234567");
        String loginToken = new JwtService(SECRET, 60_000).generateToken(user);

        assertThat(signer.verify(loginToken)).isEmpty();
    }

    @Test
    void aDocumentLink_isNotAValidLoginToken() {
        String link = signer.issue(UUID.randomUUID());

        assertThat(new JwtService(SECRET, 60_000).isTokenValid(link)).isFalse();
    }
}
