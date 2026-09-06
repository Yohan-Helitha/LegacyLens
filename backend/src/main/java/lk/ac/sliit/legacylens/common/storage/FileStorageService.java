package lk.ac.sliit.legacylens.common.storage;

import lk.ac.sliit.legacylens.common.exception.InvalidFileUploadException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Saves uploaded files to a local directory on disk and returns a
 * "/uploads/..." URL clients can use to fetch them back — see WebConfig's
 * resource handler for that mapping. No cloud storage (S3, etc.) is wired
 * up in this project yet; swap this implementation out if one is added
 * later, callers only depend on {@link #store}.
 */
@Service
public class FileStorageService {

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "application/pdf", "image/jpeg", "image/png", "image/jpg"
    );
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10MB

    @Value("${app.upload.dir:uploads}")
    private String uploadRootDir;

    /**
     * Stores the file under {@code {uploadRootDir}/{subDirectory}/} using a
     * generated name (never the client-supplied filename, to avoid path
     * traversal / collisions) and returns the public "/uploads/..." URL.
     */
    public String store(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileUploadException("A file is required");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new InvalidFileUploadException("File must not exceed 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidFileUploadException("Only PDF, JPG or PNG files are allowed");
        }

        try {
            Path targetDir = Paths.get(uploadRootDir, subDirectory).normalize();
            Files.createDirectories(targetDir);

            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String generatedName = UUID.randomUUID() + (extension != null ? "." + extension : "");

            Path targetFile = targetDir.resolve(generatedName).normalize();
            file.transferTo(targetFile);

            return "/uploads/" + subDirectory + "/" + generatedName;
        } catch (IOException ex) {
            throw new InvalidFileUploadException("Failed to store the uploaded file");
        }
    }
}
