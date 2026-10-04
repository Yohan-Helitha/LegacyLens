package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.ProofLinkResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class CreatorProofServiceImpl implements CreatorProofService {

    static final String LINK_PATH_PREFIX = "/api/creator-proofs/";
    private static final String UPLOADS_PREFIX = "/uploads/";

    private final CreatorApplicationRepository creatorApplicationRepository;
    private final FileStorageService fileStorageService;
    private final ProofLinkSigner signer;

    public CreatorProofServiceImpl(
            CreatorApplicationRepository creatorApplicationRepository,
            FileStorageService fileStorageService,
            ProofLinkSigner signer) {

        this.creatorApplicationRepository = creatorApplicationRepository;
        this.fileStorageService = fileStorageService;
        this.signer = signer;
    }

    @Override
    @Transactional(readOnly = true)
    public ProofLinkResponse createLink(UUID userId) {
        CreatorApplication application = applicationWithProof(userId);
        return ProofLinkResponse.builder()
                .path(LINK_PATH_PREFIX + signer.issue(userId))
                .contentType(ProofContentTypes.forFile(application.getProofDocumentUrl()))
                .expiresAt(LocalDateTime.now().plus(ProofLinkSigner.LIFETIME))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ProofDocument open(String token) {
        UUID ownerId = signer.verify(token)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        String storedUrl = applicationWithProof(ownerId).getProofDocumentUrl();
        String relativePath = storedUrl.startsWith(UPLOADS_PREFIX) ? storedUrl.substring(UPLOADS_PREFIX.length()) : storedUrl;
        Path file = fileStorageService.resolve(relativePath);
        if (!Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Document not found");
        }
        return new ProofDocument(file, ProofContentTypes.forFile(storedUrl));
    }

    private CreatorApplication applicationWithProof(UUID userId) {
        return creatorApplicationRepository.findByUserId(userId)
                .filter(application -> application.getProofDocumentUrl() != null && !application.getProofDocumentUrl().isBlank())
                .orElseThrow(() -> new ResourceNotFoundException("No verification document on file"));
    }
}
