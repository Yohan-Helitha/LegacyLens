package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorContributionResponse;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorOwnerDetailsResponse;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorProfileResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.service.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

/** Shapes what is known about a creator into the profile page, keeping private details out unless asked for. */
@Component
public class CreatorProfileResponseMapper {

    /** The numbers behind the "Contribution Summary" row and the header. */
    public record Stats(long contributions, long completed, long approved, long active) {
    }

    public CreatorProfileResponse toResponse(
            CreatorCandidate creator, Stats stats, List<Job> previousJobs, boolean includePrivateDetails) {

        User user = creator.user();
        CreatorApplication application = creator.application();

        return CreatorProfileResponse.builder()
                .userId(user.getId())
                .name(user.getFullName())
                .avatarUrl(user.getProfilePhotoUrl())
                .city(user.getCity() != null ? user.getCity().getName() : null)
                .rating(creator.rating())
                .contributionsCount(stats.contributions())
                .aboutYou(creator.about())
                .skills(creator.skills())
                .languages(creator.languages())
                .interests(creator.interests())
                .experienceLevel(application != null && application.getExperienceLevel() != null
                        ? application.getExperienceLevel().name() : null)
                .experienceDescription(application != null ? application.getExperienceDescription() : null)
                .completedCount(stats.completed())
                .approvedCount(stats.approved())
                .activeCount(stats.active())
                .previousContributions(previousJobs.stream().map(CreatorProfileResponseMapper::toContribution).toList())
                .ownerDetails(includePrivateDetails ? toOwnerDetails(user, application) : null)
                .build();
    }

    private static CreatorContributionResponse toContribution(Job job) {
        return CreatorContributionResponse.builder()
                .jobId(job.getId())
                .title(job.getTitle())
                .completedAt(job.getCompletedAt())
                .build();
    }

    private static CreatorOwnerDetailsResponse toOwnerDetails(User user, CreatorApplication application) {
        boolean proofUploaded = application != null && application.getProofDocumentUrl() != null
                && !application.getProofDocumentUrl().isBlank();
        return CreatorOwnerDetailsResponse.builder()
                .email(application != null ? application.getEmail() : null)
                .phoneNumber(user.getPhoneNumber())
                .nicNumber(user.getNicNumber())
                .applicationStatus(application != null ? application.getStatus().name() : null)
                .proofUploaded(proofUploaded)
                .proofContentType(proofUploaded ? ProofContentTypes.forFile(application.getProofDocumentUrl()) : null)
                .build();
    }
}
