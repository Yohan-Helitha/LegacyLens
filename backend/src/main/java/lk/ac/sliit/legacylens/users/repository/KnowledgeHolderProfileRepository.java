package lk.ac.sliit.legacylens.users.repository;

import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeHolderProfileRepository extends JpaRepository<KnowledgeHolderProfile, UUID> {

    Optional<KnowledgeHolderProfile> findByUserId(UUID userId);
}
