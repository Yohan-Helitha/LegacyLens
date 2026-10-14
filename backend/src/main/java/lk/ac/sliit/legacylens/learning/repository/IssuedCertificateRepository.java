package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.IssuedCertificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IssuedCertificateRepository extends JpaRepository<IssuedCertificate, Long> {

	Optional<IssuedCertificate> findByUserIdAndTrackId(UUID userId, Long trackId);

	Optional<IssuedCertificate> findByVerificationCode(String verificationCode);

	List<IssuedCertificate> findByUserIdOrderByIssuedAtDesc(UUID userId);

	boolean existsByUserIdAndTrackId(UUID userId, Long trackId);
}
