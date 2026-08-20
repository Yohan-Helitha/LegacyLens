package lk.ac.sliit.legacylens.users.repository;

import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /** Used by Spring Security to load a user during login. */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /** Quick existence check before registration. */
    boolean existsByPhoneNumber(String phoneNumber);

    /** Check for duplicate NIC numbers during registration. */
    boolean existsByNicNumber(String nicNumber);

    /**
     * Used by JwtAuthenticationFilter (via CustomUserDetailsService) to load a
     * user per-request. Roles must come back already initialized here — the
     * Hibernate session is gone by the time CustomUserDetails.getAuthorities()
     * runs, so a plain lazy findById() throws LazyInitializationException.
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") UUID id);
}
