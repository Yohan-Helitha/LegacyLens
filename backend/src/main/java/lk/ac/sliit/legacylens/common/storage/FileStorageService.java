package lk.ac.sliit.legacylens.common.storage;

import lk.ac.sliit.legacylens.common.exception.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Local-disk media storage for uploaded story recordings/videos. Everything
 * lives under one root directory (see app.storage.upload-dir), organized
 * into subfolders per resource type (e.g. "stories").
 *
 * This is a placeholder for a real object store (S3 / Supabase Storage) —
 * swapping it later only means replacing this one class, since callers only
 * ever see relative paths, never the filesystem layout.
 */
@Service
public class FileStorageService {

    private static final Pattern SAFE_EXTENSION = Pattern.compile("^\\.[A-Za-z0-9]{1,10}$");

    private final Path rootDir;

    public FileStorageService(@Value("${app.storage.upload-dir}") String uploadDir) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(rootDir);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + rootDir, e);
        }
    }

    /** Absolute path to the storage root — used to wire up static serving of /uploads/**. */
    public Path getRootDir() {
        return rootDir;
    }

    /**
     * Saves the file under {@code subfolder} with a random name (the
     * original filename is never trusted or persisted). Returns a path
     * relative to the storage root, e.g. "stories/3f9c...-e1.m4a".
     */
    public String store(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Cannot store an empty file");
        }

        String filename = UUID.randomUUID() + safeExtension(file.getOriginalFilename());
        Path targetDir = resolveWithinRoot(subfolder);
        Path target = targetDir.resolve(filename);

        try {
            Files.createDirectories(targetDir);
            file.transferTo(target);
        } catch (IOException e) {
            throw new FileStorageException("Failed to store uploaded file", e);
        }

        return subfolder + "/" + filename;
    }

    /** Best-effort delete — silently no-ops on a blank path or a file that's already gone. */
    public void delete(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            return;
        }

        Path target = resolveWithinRoot(relativePath);

        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new FileStorageException("Failed to delete file: " + relativePath, e);
        }
    }

    /** Resolves a stored relative path back to an absolute filesystem path (e.g. for streaming it back). */
    public Path resolve(String relativePath) {
        return resolveWithinRoot(relativePath);
    }

    /** Keeps every resolved path inside the storage root, even if a caller passes "../../etc/passwd". */
    private Path resolveWithinRoot(String relativePath) {
        Path resolved = rootDir.resolve(relativePath).normalize();

        if (!resolved.startsWith(rootDir)) {
            throw new FileStorageException("Invalid storage path: " + relativePath);
        }

        return resolved;
    }

    private String safeExtension(String originalFilename) {
        if (originalFilename == null) {
            return "";
        }

        int dot = originalFilename.lastIndexOf('.');
        if (dot < 0) {
            return "";
        }

        String extension = originalFilename.substring(dot).toLowerCase();
        return SAFE_EXTENSION.matcher(extension).matches() ? extension : "";
    }
}
