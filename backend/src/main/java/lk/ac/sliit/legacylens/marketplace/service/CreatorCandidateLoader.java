package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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
    private final OpportunityRepository opportunityRepository;

    public CreatorCandidateLoader(
            CreatorProfileRepository creatorProfileRepository,
            CreatorApplicationRepository creatorApplicationRepository,
            JobRepository jobRepository,
            OpportunityRepository opportunityRepository) {

        this.creatorProfileRepository = creatorProfileRepository;
        this.creatorApplicationRepository = creatorApplicationRepository;
        this.jobRepository = jobRepository;
        this.opportunityRepository = opportunityRepository;
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

        Map<UUID, List<PastWork>> pastWorkByCreator = pastWork(userIds);

        return profiles.stream()
                .map(profile -> {
                    UUID userId = profile.getUser().getId();
                    List<PastWork> pastWork = pastWorkByCreator.getOrDefault(userId, List.of());
                    return new CreatorCandidate(
                            profile.getUser(),
                            profile,
                            applicationsByUser.get(userId),
                            pastWork.size(),
                            pastWork);
                })
                .toList();
    }

    /** Each creator's completed jobs, with the category of the opportunity each one came from. */
    private Map<UUID, List<PastWork>> pastWork(List<UUID> creatorIds) {
        List<Job> jobs = jobRepository.findByCreatorIdInAndStatus(creatorIds, JobStatus.COMPLETED);
        if (jobs.isEmpty()) {
            return Map.of();
        }

        List<UUID> opportunityIds = jobs.stream().map(Job::getOpportunityId).filter(id -> id != null).distinct().toList();
        Map<UUID, String> categoryByOpportunity = new HashMap<>();
        for (Opportunity opportunity : opportunityRepository.findAllById(opportunityIds)) {
            categoryByOpportunity.put(opportunity.getId(), opportunity.getCategory());
        }

        Map<UUID, List<PastWork>> byCreator = new HashMap<>();
        for (Job job : jobs) {
            byCreator.computeIfAbsent(job.getCreator().getId(), id -> new ArrayList<>())
                    .add(new PastWork(job.getTitle(), job.getDescription(), categoryByOpportunity.get(job.getOpportunityId())));
        }
        return byCreator;
    }
}
