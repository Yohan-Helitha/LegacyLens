package lk.ac.sliit.legacylens.users.repository;

import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    /** Fetch all role assignments for a given user. */
    List<UserRole> findByUserId(UUID userId);

    /** Check whether a user already has a specific role (avoids duplicates). */
    boolean existsByUserIdAndRoleType(UUID userId, RoleType roleType);

    /** Find all active roles for a user — used in JWT claim generation. */
    List<UserRole> findByUserIdAndStatus(UUID userId, RoleStatus status);
}
