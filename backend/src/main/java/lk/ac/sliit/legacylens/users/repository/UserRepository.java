package lk.ac.sliit.legacylens.users.repository;

import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
