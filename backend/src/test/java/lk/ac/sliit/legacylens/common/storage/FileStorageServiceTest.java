package lk.ac.sliit.legacylens.common.storage;

import lk.ac.sliit.legacylens.common.exception.FileStorageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Pure unit tests — no Spring context needed, just a real temp directory on
 * disk, since the whole point of this class is filesystem interaction.
 */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(tempDir.resolve("uploads").toString());
    }

    @Test
    void constructor_createsUploadDirectoryIfMissing() {
        assertThat(fileStorageService.getRootDir()).exists().isDirectory();
    }

    @Test
    void store_savesFileUnderSubfolder_andReturnsRelativePath() {
        MockMultipartFile file = new MockMultipartFile("media", "voice-note.m4a", "audio/m4a", "hello".getBytes());

        String relativePath = fileStorageService.store(file, "stories");

        assertThat(relativePath).startsWith("stories/").endsWith(".m4a");
        assertThat(fileStorageService.resolve(relativePath)).exists();
    }

    @Test
    void store_neverTrustsOriginalFilename_generatesRandomName() {
        MockMultipartFile fileA = new MockMultipartFile("media", "clip.mp3", "audio/mp3", "a".getBytes());
        MockMultipartFile fileB = new MockMultipartFile("media", "clip.mp3", "audio/mp3", "b".getBytes());

        String pathA = fileStorageService.store(fileA, "stories");
        String pathB = fileStorageService.store(fileB, "stories");

        assertThat(pathA).isNotEqualTo(pathB);
    }

    @Test
    void store_unsafeExtension_isDropped() {
        MockMultipartFile file = new MockMultipartFile(
                "media", "script.php.exe;rm -rf", "application/octet-stream", "x".getBytes());

        String relativePath = fileStorageService.store(file, "stories");

        assertThat(relativePath).doesNotContain(";").doesNotContain(" ");
    }

    @Test
    void store_emptyFile_throwsFileStorageException() {
        MockMultipartFile empty = new MockMultipartFile("media", "empty.mp3", "audio/mp3", new byte[0]);

        assertThrows(FileStorageException.class, () -> fileStorageService.store(empty, "stories"));
    }

    @Test
    void store_pathTraversalInSubfolder_isRejected() {
        MockMultipartFile file = new MockMultipartFile("media", "clip.mp3", "audio/mp3", "a".getBytes());

        assertThrows(FileStorageException.class, () -> fileStorageService.store(file, "../../etc"));
    }

    @Test
    void delete_removesStoredFile() {
        MockMultipartFile file = new MockMultipartFile("media", "clip.mp3", "audio/mp3", "a".getBytes());
        String relativePath = fileStorageService.store(file, "stories");
        assertThat(fileStorageService.resolve(relativePath)).exists();

        fileStorageService.delete(relativePath);

        assertThat(fileStorageService.resolve(relativePath)).doesNotExist();
    }

    @Test
    void delete_missingFile_isANoOp() {
        fileStorageService.delete("stories/does-not-exist.mp3");
        // No exception — best-effort delete.
    }

    @Test
    void delete_blankPath_isANoOp() {
        fileStorageService.delete("");
        fileStorageService.delete(null);
    }

    @Test
    void delete_pathTraversal_isRejected() {
        assertThrows(FileStorageException.class, () -> fileStorageService.delete("../../etc/passwd"));
    }

    /** Sanity check that the temp dir cleans up fine even after files were written into it. */
    @Test
    void store_writesActualBytesToDisk() throws IOException {
        byte[] content = "story audio bytes".getBytes();
        MockMultipartFile file = new MockMultipartFile("media", "clip.m4a", "audio/m4a", content);

        String relativePath = fileStorageService.store(file, "stories");

        byte[] written = Files.readAllBytes(fileStorageService.resolve(relativePath));
        assertThat(written).isEqualTo(content);
    }
}
