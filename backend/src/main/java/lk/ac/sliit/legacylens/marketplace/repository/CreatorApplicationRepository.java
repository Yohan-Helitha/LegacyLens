package lk.ac.sliit.legacylens.marketplace.repository;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CreatorApplicationRepository extends JpaRepository<CreatorApplication, UUID> {

    Optional<CreatorApplication> findByUserId(UUID userId);

    /** Admin use: fetch all applications awaiting review. */
    List<CreatorApplication> findByStatus(VerificationStatus status);
}
