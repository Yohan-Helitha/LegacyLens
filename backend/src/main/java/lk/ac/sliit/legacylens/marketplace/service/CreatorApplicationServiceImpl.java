package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.DuplicateCreatorApplicationException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.CreatorApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Owns the "Become a Content Creator" application lifecycle: submission,
 * proof-file storage, and status lookup. Does not grant the YOUTH_CREATOR
 * role itself — that happens separately once an admin moves the application
 * to VERIFIED (admin review is not part of this slice yet).
 */
@Service
public class CreatorApplicationServiceImpl implements CreatorApplicationService {

    /** Subdirectory (under app.upload.dir) that verification proof files are stored in. */
    private static final String PROOF_UPLOAD_SUBDIR = "creator-proofs";

    private final CreatorApplicationRepository creatorApplicationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public CreatorApplicationServiceImpl(
            CreatorApplicationRepository creatorApplicationRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {

        this.creatorApplicationRepository = creatorApplicationRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
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

        String proofDocumentUrl = fileStorageService.store(request.getProofDocument(), PROOF_UPLOAD_SUBDIR);

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
                .experienceLevel(application.getExperienceLevel().name())
                .experienceDescription(application.getExperienceDescription())
                .proofDocumentUrl(application.getProofDocumentUrl())
                .status(application.getStatus().name())
                .submittedAt(application.getSubmittedAt())
                .build();
    }
}
