package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.DuplicateCreatorApplicationException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.dto.UpdateCreatorDetailsRequest;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.matching.LanguageSkill;
import lk.ac.sliit.legacylens.marketplace.matching.LanguageSkills;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.CreatorProfileRepository;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Owns the "Become a Content Creator" application lifecycle: submission,
 * proof-file storage, and status lookup. Does not grant the YOUTH_CREATOR
 * role itself — that happens separately once an admin moves the application
 * to VERIFIED (admin review is not part of this slice yet).
 */
@Service
public class CreatorApplicationServiceImpl implements CreatorApplicationService {

    /** Subdirectory (under app.storage.upload-dir) that verification proof files are stored in. */
    private static final String PROOF_UPLOAD_SUBDIR = "creator-proofs";

    private static final List<String> ALLOWED_PROOF_CONTENT_TYPES = List.of(
            "application/pdf", "image/jpeg", "image/png", "image/jpg"
    );
    private static final long MAX_PROOF_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10MB

    private final CreatorApplicationRepository creatorApplicationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final CreatorProfileRepository creatorProfileRepository;

    public CreatorApplicationServiceImpl(
            CreatorApplicationRepository creatorApplicationRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            CreatorProfileRepository creatorProfileRepository) {

        this.creatorApplicationRepository = creatorApplicationRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.creatorProfileRepository = creatorProfileRepository;
    }

    @Override
    @Transactional
    public CreatorApplicationResponse submitApplication(UUID userId, CreatorApplicationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CreatorApplication application = creatorApplicationRepository.findByUserId(userId)
                .orElseGet(CreatorApplication::new);

        // A brand-new application has no id yet; an existing one only blocks
        // resubmission while it's still PENDING or already VERIFIED.
        boolean isExisting = application.getId() != null;
        if (isExisting && application.getStatus() != VerificationStatus.REJECTED) {
            throw new DuplicateCreatorApplicationException(
                    "You already have a creator application on file.");
        }

        // Checked before the file is stored, so a bad request never leaves an orphan upload behind.
        List<LanguageSkill> languages = LanguageSkills.parseSubmitted(request.getLanguages());

        String proofDocumentUrl = fileStorageService.store(
                request.getProofDocument(), PROOF_UPLOAD_SUBDIR, ALLOWED_PROOF_CONTENT_TYPES, MAX_PROOF_FILE_SIZE_BYTES);

        // full_name / phone_number / city / nic_number are never taken from
        // the request — always snapshotted from the user's own verified
        // profile so an applicant can't submit someone else's identity.
        application.setUser(user);
        application.setFullName(user.getFullName());
        application.setPhoneNumber(user.getPhoneNumber());
        application.setCity(user.getCity() != null ? user.getCity().getName() : null);
        application.setNicNumber(user.getNicNumber());
        application.setEmail(request.getEmail());
        application.setAboutYou(request.getAboutYou());
        application.setSkills(String.join(", ", request.getSkills()));
        application.setInterests(String.join(", ", request.getInterests()));
        application.setLanguages(LanguageSkills.serialize(languages));
        application.setExperienceLevel(request.getExperienceLevel());
        application.setExperienceDescription(request.getExperienceDescription());
        application.setProofDocumentUrl(proofDocumentUrl);
        application.setStatus(VerificationStatus.PENDING);
        application.setSubmittedAt(LocalDateTime.now());

        CreatorApplication saved = creatorApplicationRepository.save(application);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CreatorApplicationResponse getMyApplication(UUID userId) {
        CreatorApplication application = creatorApplicationRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No creator application found"));

        return mapToResponse(application);
    }

    @Override
    @Transactional
    public CreatorApplicationResponse updateMyLanguages(UUID userId, List<String> languages) {
        CreatorApplication application = creatorApplicationRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No creator application found"));

        application.setLanguages(LanguageSkills.serialize(LanguageSkills.parseSubmitted(languages)));

        return mapToResponse(creatorApplicationRepository.save(application));
    }

    @Override
    @Transactional
    public CreatorApplicationResponse updateMyDetails(UUID userId, UpdateCreatorDetailsRequest request) {
        CreatorApplication application = creatorApplicationRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No creator application found"));

        String skills = joinTags(request.getSkills());
        String interests = joinTags(request.getInterests());

        application.setEmail(request.getEmail().trim());
        application.setAboutYou(request.getAboutYou() == null || request.getAboutYou().isBlank() ? null : request.getAboutYou().trim());
        application.setSkills(skills);
        application.setInterests(interests);
        application.setExperienceLevel(request.getExperienceLevel());
        application.setExperienceDescription(request.getExperienceDescription().trim());
        application.setAdditionalPhoneNumbers(request.getAdditionalPhoneNumbers() == null || request.getAdditionalPhoneNumbers().isEmpty()
                ? null
                : String.join(",", request.getAdditionalPhoneNumbers().stream().map(String::trim).distinct().toList()));

        // A creator's skills and interests are read from the application and the profile together, so keep the
        // two in step - otherwise something the creator just removed would still be shown from the profile.
        creatorProfileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setSkills(skills);
            profile.setInterests(interests);
            creatorProfileRepository.save(profile);
        });

        return mapToResponse(creatorApplicationRepository.save(application));
    }

    /** Trimmed, de-duplicated (ignoring capitals) and comma separated, the way skills are stored. */
    private static String joinTags(List<String> tags) {
        java.util.Set<String> seen = new java.util.LinkedHashSet<>();
        java.util.List<String> kept = new java.util.ArrayList<>();
        for (String tag : tags) {
            String clean = tag.trim().replace(",", " ");
            if (!clean.isBlank() && seen.add(clean.toLowerCase(java.util.Locale.ROOT))) {
                kept.add(clean);
            }
        }
        return String.join(", ", kept);
    }

    private CreatorApplicationResponse mapToResponse(CreatorApplication application) {
        return CreatorApplicationResponse.builder()
                .id(application.getId())
                .userId(application.getUser().getId())
                .fullName(application.getFullName())
                .phoneNumber(application.getPhoneNumber())
                .city(application.getCity())
                .nicNumber(application.getNicNumber())
                .email(application.getEmail())
                .aboutYou(application.getAboutYou())
                .skills(application.getSkills())
                .interests(application.getInterests())
                .languages(LanguageSkills.toResponses(LanguageSkills.deserialize(application.getLanguages())))
                .experienceLevel(application.getExperienceLevel().name())
                .experienceDescription(application.getExperienceDescription())
                .proofUploaded(application.getProofDocumentUrl() != null && !application.getProofDocumentUrl().isBlank())
                .status(application.getStatus().name())
                .submittedAt(application.getSubmittedAt())
                .build();
    }
}
