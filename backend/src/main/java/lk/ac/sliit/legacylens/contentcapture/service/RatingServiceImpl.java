package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.contentcapture.entity.ElderRating;
import lk.ac.sliit.legacylens.contentcapture.repository.ElderRatingRepository;
import lk.ac.sliit.legacylens.users.entity.KnowledgeHolderProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.KnowledgeHolderProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class RatingServiceImpl implements RatingService {

    private final ElderRatingRepository elderRatingRepository;
    private final KnowledgeHolderProfileRepository knowledgeHolderProfileRepository;
    private final UserRepository userRepository;

    public RatingServiceImpl(
            ElderRatingRepository elderRatingRepository,
            KnowledgeHolderProfileRepository knowledgeHolderProfileRepository,
            UserRepository userRepository) {

        this.elderRatingRepository = elderRatingRepository;
        this.knowledgeHolderProfileRepository = knowledgeHolderProfileRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void submitRating(UUID elderId, UUID ratedByUserId, int score, String comment) {
        if (elderId.equals(ratedByUserId)) {
            throw new InvalidRequestException("You can't rate yourself");
        }

        KnowledgeHolderProfile profile = knowledgeHolderProfileRepository.findByUserId(elderId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge holder profile not found"));

        User elder = userRepository.findById(elderId)
                .orElseThrow(() -> new ResourceNotFoundException("Elder not found"));
        User ratedBy = userRepository.findById(ratedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ElderRating rating = new ElderRating();
        rating.setElder(elder);
        rating.setRatedBy(ratedBy);
        rating.setScore(score);
        rating.setComment(comment);
        elderRatingRepository.save(rating);

        recalculateSummary(elderId, profile);
    }

    /** The controller/caller never touches average_rating/rating_count directly — encapsulated here. */
    private void recalculateSummary(UUID elderId, KnowledgeHolderProfile profile) {
        Double average = elderRatingRepository.calculateAverageScore(elderId);
        long count = elderRatingRepository.countByElderId(elderId);

        profile.setAverageRating(average == null
                ? null
                : BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP));
        profile.setRatingCount((int) count);

        knowledgeHolderProfileRepository.save(profile);
    }
}
