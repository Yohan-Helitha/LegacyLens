package lk.ac.sliit.legacylens.admin.repository;

import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpportunityAudioRepository extends JpaRepository<OpportunityAudio, UUID> {
    List<OpportunityAudio> findByStatus(AudioReviewStatus status);

    List<OpportunityAudio> findByStatusNot(AudioReviewStatus status);

    Optional<OpportunityAudio> findByAudioUrl(String audioUrl);
}
