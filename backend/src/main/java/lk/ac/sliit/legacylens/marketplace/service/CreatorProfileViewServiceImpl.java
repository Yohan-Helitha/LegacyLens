package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorProfileResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.service.CreatorProfileResponseMapper.Stats;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class CreatorProfileViewServiceImpl implements CreatorProfileViewService {

    /** How many finished pieces of work are listed under "Previous Contribution". */
    static final int PREVIOUS_CONTRIBUTIONS_SHOWN = 5;

    private static final Set<JobStatus> ACTIVE_JOB_STATUSES = Set.of(JobStatus.ACTIVE, JobStatus.UPCOMING);
    private static final Set<OpportunityApplicationStatus> APPROVED_STATUSES =
            Set.of(OpportunityApplicationStatus.APPROVED, OpportunityApplicationStatus.BOOKED);

    private final UserRepository userRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final CreatorApplicationRepository creatorApplicationRepository;
    private final JobRepository jobRepository;
    private final OpportunityApplicationRepository opportunityApplicationRepository;
    private final CreatorProfileResponseMapper mapper;

    public CreatorProfileViewServiceImpl(
            UserRepository userRepository,
            CreatorProfileRepository creatorProfileRepository,
            CreatorApplicationRepository creatorApplicationRepository,
            JobRepository jobRepository,
            OpportunityApplicationRepository opportunityApplicationRepository,
            CreatorProfileResponseMapper mapper) {

        this.userRepository = userRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.creatorApplicationRepository = creatorApplicationRepository;
        this.jobRepository = jobRepository;
        this.opportunityApplicationRepository = opportunityApplicationRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public CreatorProfileResponse getProfile(UUID viewerId, UUID creatorUserId) {
        boolean isOwner = creatorUserId.equals(viewerId);

        User user = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));
        CreatorProfile profile = creatorProfileRepository.findByUserId(creatorUserId).orElse(null);
        CreatorApplication application = creatorApplicationRepository.findByUserId(creatorUserId).orElse(null);

        // Other people only ever see verified creators - an unverified or unknown one is simply "not found".
        boolean verified = profile != null && profile.getVerificationStatus() == VerificationStatus.VERIFIED;
        boolean hasAnythingToShow = profile != null || application != null;
        if (isOwner ? !hasAnythingToShow : !verified) {
            throw new ResourceNotFoundException("Creator not found");
        }

        long completed = jobRepository.countByCreatorIdAndStatus(creatorUserId, JobStatus.COMPLETED);
        Stats stats = new Stats(
                jobRepository.countDistinctEldersByCreatorIdAndStatus(creatorUserId, JobStatus.COMPLETED),
                completed,
                opportunityApplicationRepository.countByCreatorIdAndStatusIn(creatorUserId, APPROVED_STATUSES),
                jobRepository.countByCreatorIdAndStatusIn(creatorUserId, ACTIVE_JOB_STATUSES));

        List<Job> previousJobs = jobRepository.findByCreatorIdAndStatus(creatorUserId, JobStatus.COMPLETED,
                PageRequest.of(0, PREVIOUS_CONTRIBUTIONS_SHOWN, Sort.by(Sort.Direction.DESC, "completedAt")));

        return mapper.toResponse(new CreatorCandidate(user, profile, application, completed), stats, previousJobs, isOwner);
    }
}
