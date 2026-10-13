package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.marketplace.dto.CreatorContributionResponse;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorOwnerDetailsResponse;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorProfileResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.Job;
import lk.ac.sliit.legacylens.marketplace.matching.CreatorMatchScorer.CreatorCandidate;
import lk.ac.sliit.legacylens.marketplace.matching.LanguageSkills;
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
                .maskedNic(maskNic(user.getNicNumber()))
                .aboutYou(creator.about())
                .skills(creator.skills())
                .languages(LanguageSkills.toResponses(creator.languageSkills()))
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

    /** "200272401447" becomes "20XXXXXXXX47": only the first two and last two characters are shown. */
    static String maskNic(String nic) {
        if (nic == null || nic.isBlank()) {
            return null;
        }
        String clean = nic.trim();
        if (clean.length() <= 4) {
            return "X".repeat(clean.length());
        }
        return clean.substring(0, 2) + "X".repeat(clean.length() - 4) + clean.substring(clean.length() - 2);
    }

    private static List<String> additionalNumbers(CreatorApplication application) {
        if (application == null || application.getAdditionalPhoneNumbers() == null || application.getAdditionalPhoneNumbers().isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(application.getAdditionalPhoneNumbers().split(","))
                .map(String::trim).filter(number -> !number.isEmpty()).toList();
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
                .additionalPhoneNumbers(additionalNumbers(application))
                .nicNumber(user.getNicNumber())
                .applicationStatus(application != null ? application.getStatus().name() : null)
                .proofUploaded(proofUploaded)
                .proofContentType(proofUploaded ? ProofContentTypes.forFile(application.getProofDocumentUrl()) : null)
                .build();
    }
}
