package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Gathers everything the matching needs to know about each creator who could be recommended. */
@Component
public class CreatorCandidateLoader {

    private final CreatorProfileRepository creatorProfileRepository;
    private final CreatorApplicationRepository creatorApplicationRepository;
    private final JobRepository jobRepository;

    public CreatorCandidateLoader(
            CreatorProfileRepository creatorProfileRepository,
            CreatorApplicationRepository creatorApplicationRepository,
            JobRepository jobRepository) {

        this.creatorProfileRepository = creatorProfileRepository;
        this.creatorApplicationRepository = creatorApplicationRepository;
        this.jobRepository = jobRepository;
    }

    /** Verified, active creators (never the elder themselves) with everything scoring needs. */
    public List<CreatorCandidate> loadCandidates(UUID elderId) {
        List<CreatorProfile> profiles = creatorProfileRepository.findByVerificationStatus(VerificationStatus.VERIFIED)
                .stream()
                .filter(profile -> profile.getUser().getAccountStatus() == AccountStatus.ACTIVE)
                .filter(profile -> !profile.getUser().getId().equals(elderId))
                .toList();
        if (profiles.isEmpty()) {
            return List.of();
        }

        List<UUID> userIds = profiles.stream().map(profile -> profile.getUser().getId()).toList();
        Map<UUID, CreatorApplication> applicationsByUser = creatorApplicationRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(application -> application.getUser().getId(), Function.identity(), (a, b) -> a));

        Map<UUID, Long> completedJobs = new HashMap<>();
        for (Object[] row : jobRepository.countByStatusGroupedByCreator(JobStatus.COMPLETED)) {
            completedJobs.put((UUID) row[0], ((Number) row[1]).longValue());
        }

        return profiles.stream()
                .map(profile -> {
                    UUID userId = profile.getUser().getId();
                    return new CreatorCandidate(
                            profile.getUser(),
                            profile,
                            applicationsByUser.get(userId),
                            completedJobs.getOrDefault(userId, 0L));
                })
                .toList();
    }
}
