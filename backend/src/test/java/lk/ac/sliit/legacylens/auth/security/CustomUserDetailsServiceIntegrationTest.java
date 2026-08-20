package lk.ac.sliit.legacylens.auth.security;

import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression test for the LazyInitializationException that used to crash every
 * request carrying a Bearer token (JwtAuthenticationFilter -> CustomUserDetails.
 * getAuthorities() -> user.getRoles() on a closed Hibernate session).
 *
 * This has to run against a real H2-backed session rather than a mocked
 * UserRepository — a mock just returns whatever list you hand it regardless of
 * fetch type, so it can never reproduce a lazy-proxy failure.
 *
 * The class-level NOT_SUPPORTED propagation is deliberate: @DataJpaTest
 * normally wraps each test method in one transaction that's rolled back at the
 * end, which would keep a single Hibernate session open for the whole test and
 * hide this exact bug. Disabling that means loadUserByUsername() has to manage
 * its own session lifecycle here, exactly like it does in production when
 * JwtAuthenticationFilter calls it with no transaction of its own.
 */
@DataJpaTest
@Import(CustomUserDetailsService.class)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class CustomUserDetailsServiceIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void loadUserByUsername_thenGetAuthorities_worksAfterSessionCloses() {
        UUID userId = seedUserWithRoleInItsOwnCommittedTransaction();

        // No Hibernate session is open for the calling code at this point —
        // loadUserByUsername()'s own @Transactional boundary already closed
        // when it returned. This mirrors JwtAuthenticationFilter.authenticate():
        // call loadUserByUsername(), then read getAuthorities() afterward.
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(userId.toString());

        assertThat(userDetails.getAuthorities())
                .extracting(Object::toString)
                .containsExactly("ROLE_GENERAL_USER");
    }

    private UUID seedUserWithRoleInItsOwnCommittedTransaction() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        return transactionTemplate.execute(status -> {
            User user = new User();
            user.setFullName("Test User");
            user.setPhoneNumber("+94770000000");
            user.setDateOfBirth(LocalDate.of(1990, 1, 1));
            user.setNicNumber("900010000000");
            user.setPinHash("irrelevant-hash");

            UserRole role = new UserRole();
            role.setUser(user);
            role.setRoleType(RoleType.GENERAL_USER);
            role.setStatus(RoleStatus.ACTIVE);
            user.getRoles().add(role);

            User saved = userRepository.save(user);
            return saved.getId();
        });
    }
}
