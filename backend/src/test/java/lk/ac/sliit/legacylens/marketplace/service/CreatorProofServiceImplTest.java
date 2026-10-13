package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.marketplace.dto.ProofLinkResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatorProofServiceImplTest {

    @Mock private CreatorApplicationRepository creatorApplicationRepository;

    @TempDir Path uploadRoot;

    private ProofLinkSigner signer;
    private CreatorProofServiceImpl service;

    private final UUID owner = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        FileStorageService storage = new FileStorageService(uploadRoot.toString());
        signer = new ProofLinkSigner("test-secret-test-secret-test-secret-123456");
        service = new CreatorProofServiceImpl(creatorApplicationRepository, storage, signer);
    }

    private void applicationWithProof(String storedUrl) {
        CreatorApplication application = new CreatorApplication();
        application.setProofDocumentUrl(storedUrl);
        when(creatorApplicationRepository.findByUserId(owner)).thenReturn(Optional.of(application));
    }

    @Test
    void createLink_pointsAtTheTokenEndpointAndSaysWhatKindOfFileItIs() {
        applicationWithProof("/uploads/creator-proofs/abc.png");

        ProofLinkResponse link = service.createLink(owner);

        assertThat(link.getPath()).startsWith("/api/creator-proofs/");
        assertThat(link.getContentType()).isEqualTo("image/png");
        assertThat(signer.verify(link.getPath().substring("/api/creator-proofs/".length()))).contains(owner);
    }

    @Test
    void createLink_withNoDocumentOnFile_isNotFound() {
        when(creatorApplicationRepository.findByUserId(owner)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.createLink(owner));
    }

    @Test
    void open_returnsTheOwnersFileForAValidToken() throws IOException {
        Path dir = Files.createDirectories(uploadRoot.resolve("creator-proofs"));
        Files.writeString(dir.resolve("nic.pdf"), "%PDF-fake");
        applicationWithProof("/uploads/creator-proofs/nic.pdf");

        ProofDocument document = service.open(signer.issue(owner));

        assertThat(document.contentType()).isEqualTo("application/pdf");
        assertThat(document.file()).hasContent("%PDF-fake");
    }

    @Test
    void open_withAForgedToken_isNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> service.open("forged"));
    }

    @Test
    void open_whenTheFileIsMissingFromDisk_isNotFound() {
        applicationWithProof("/uploads/creator-proofs/gone.png");

        assertThrows(ResourceNotFoundException.class, () -> service.open(signer.issue(owner)));
    }
}
