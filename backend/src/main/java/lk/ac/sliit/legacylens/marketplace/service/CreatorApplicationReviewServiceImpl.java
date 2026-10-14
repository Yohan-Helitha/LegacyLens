package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.AdminCreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.event.CreatorApplicationDecidedEvent;
import lk.ac.sliit.legacylens.marketplace.matching.LanguageSkills;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.users.entity.CreatorProfile;
import lk.ac.sliit.legacylens.users.entity.RoleStatus;
import lk.ac.sliit.legacylens.users.entity.RoleType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.UserRole;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRoleRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CreatorApplicationReviewServiceImpl implements CreatorApplicationReviewService {

    private final CreatorApplicationRepository applicationRepository;
    private final UserRoleRepository userRoleRepository;
    private final CreatorProfileRepository creatorProfileRepository;
    private final ApplicationEventPublisher events;

    public CreatorApplicationReviewServiceImpl(
            CreatorApplicationRepository applicationRepository,
            UserRoleRepository userRoleRepository,
            CreatorProfileRepository creatorProfileRepository,
            ApplicationEventPublisher events) {
        this.applicationRepository = applicationRepository;
        this.userRoleRepository = userRoleRepository;
        this.creatorProfileRepository = creatorProfileRepository;
        this.events = events;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminCreatorApplicationResponse> list(String status) {
        List<CreatorApplication> applications = (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status))
                ? applicationRepository.findAll()
                : applicationRepository.findByStatus(parse(status));
        return applications.stream()
                .sorted(Comparator.comparing(CreatorApplication::getSubmittedAt).reversed())
                .map(CreatorApplicationReviewServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminCreatorApplicationResponse get(UUID applicationId) {
        return toResponse(find(applicationId));
    }

    @Override
    @Transactional
    public AdminCreatorApplicationResponse approve(UUID applicationId, String note) {
        CreatorApplication application = pending(applicationId, "approved");
        User user = application.getUser();

        application.setStatus(VerificationStatus.VERIFIED);
        application.setReviewNote(clean(note));
        application.setReviewedAt(LocalDateTime.now());

        grantCreatorRole(user);
        verifiedProfile(user, application);

        CreatorApplication saved = applicationRepository.save(application);
        events.publishEvent(new CreatorApplicationDecidedEvent(user.getId(), true, saved.getReviewNote()));
        return toResponse(saved);
    }

    @Override
    @Transactional
    public AdminCreatorApplicationResponse reject(UUID applicationId, String reason) {
        CreatorApplication application = pending(applicationId, "rejected");

        application.setStatus(VerificationStatus.REJECTED);
        application.setReviewNote(clean(reason));
        application.setReviewedAt(LocalDateTime.now());

        CreatorApplication saved = applicationRepository.save(application);
        events.publishEvent(new CreatorApplicationDecidedEvent(saved.getUser().getId(), false, saved.getReviewNote()));
        return toResponse(saved);
    }

    /** The YOUTH_CREATOR role, active - added if the user has none yet, switched on if it was inactive. */
    private void grantCreatorRole(User user) {
        UserRole role = userRoleRepository.findByUserId(user.getId()).stream()
                .filter(r -> r.getRoleType() == RoleType.YOUTH_CREATOR)
                .findFirst()
                .orElseGet(() -> {
                    UserRole fresh = new UserRole();
                    fresh.setUser(user);
                    fresh.setRoleType(RoleType.YOUTH_CREATOR);
                    return fresh;
                });
        role.setStatus(RoleStatus.ACTIVE);
        if (role.getActivatedAt() == null) {
            role.setActivatedAt(LocalDateTime.now());
        }
        userRoleRepository.save(role);
    }

    /** The creator profile the rest of the app reads (skills, interests, rating), verified from now on. */
    private void verifiedProfile(User user, CreatorApplication application) {
        CreatorProfile profile = creatorProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            CreatorProfile fresh = new CreatorProfile();
            fresh.setUser(user);
            return fresh;
        });
        profile.setSkills(application.getSkills());
        profile.setInterests(application.getInterests());
        profile.setVerificationStatus(VerificationStatus.VERIFIED);
        creatorProfileRepository.save(profile);
    }

    private CreatorApplication find(UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator application not found"));
    }

    private CreatorApplication pending(UUID applicationId, String verb) {
        CreatorApplication application = find(applicationId);
        if (application.getStatus() != VerificationStatus.PENDING) {
            throw new InvalidApplicationStateException("Only a pending application can be " + verb + ".");
        }
        return application;
    }

    private static VerificationStatus parse(String status) {
        try {
            return VerificationStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidApplicationStateException("Unknown status: " + status);
        }
    }

    private static String clean(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    private static AdminCreatorApplicationResponse toResponse(CreatorApplication a) {
        List<String> extraPhones = a.getAdditionalPhoneNumbers() == null || a.getAdditionalPhoneNumbers().isBlank()
                ? List.of()
                : Arrays.stream(a.getAdditionalPhoneNumbers().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        return AdminCreatorApplicationResponse.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .fullName(a.getFullName())
                .phoneNumber(a.getPhoneNumber())
                .additionalPhoneNumbers(extraPhones)
                .city(a.getCity())
                .nicNumber(a.getNicNumber())
                .email(a.getEmail())
                .aboutYou(a.getAboutYou())
                .skills(a.getSkills())
                .interests(a.getInterests())
                .languages(LanguageSkills.toResponses(LanguageSkills.deserialize(a.getLanguages())))
                .experienceLevel(a.getExperienceLevel().name())
                .experienceDescription(a.getExperienceDescription())
                .proofDocumentUrl(a.getProofDocumentUrl())
                .status(a.getStatus().name())
                .submittedAt(a.getSubmittedAt())
                .reviewNote(a.getReviewNote())
                .reviewedAt(a.getReviewedAt())
                .build();
    }
}
