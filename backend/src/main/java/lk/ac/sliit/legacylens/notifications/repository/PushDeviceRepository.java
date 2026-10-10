package lk.ac.sliit.legacylens.notifications.repository;

import lk.ac.sliit.legacylens.notifications.entity.PushDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushDeviceRepository extends JpaRepository<PushDevice, UUID> {

    Optional<PushDevice> findByToken(String token);

    List<PushDevice> findByUserId(UUID userId);

    /** Has its own transaction, because the push service reports dead tokens from a background thread. */
    @Transactional
    void deleteByToken(String token);
}
