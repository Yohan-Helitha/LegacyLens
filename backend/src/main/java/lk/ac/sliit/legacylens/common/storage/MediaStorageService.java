package lk.ac.sliit.legacylens.common.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Where story media and hire-request voice notes are actually stored,
 * switched by app.storage.provider (STORAGE_PROVIDER env var) — "local"
 * (default, FileStorageService under /uploads/**) or "supabase"
 * (SupabaseStorageClient, the story-media bucket). Every caller gets back
 * a complete, playable URL either way, and passes that same URL back to
 * delete() — neither caller needs to know which provider is active.
 *
 * Deliberately scoped to just these two callers (StoryServiceImpl,
 * JobRequestServiceImpl) rather than folding every FileStorageService.store
 * call over to this — creator-proof documents, payment proofs, work
 * materials and voice replies stay on local disk; their buckets/limits
 * weren't part of this migration.
 */
@Service
public class MediaStorageService {

    private final FileStorageService fileStorageService;
    private final SupabaseStorageClient supabaseStorageClient;
    private final String provider;

    public MediaStorageService(
            FileStorageService fileStorageService,
            SupabaseStorageClient supabaseStorageClient,
            @Value("${app.storage.provider:local}") String provider) {
        this.fileStorageService = fileStorageService;
        this.supabaseStorageClient = supabaseStorageClient;
        this.provider = provider;
    }

    /** Stores the file and returns a complete URL — "/uploads/..." locally, or the bucket's public URL on Supabase. */
    public String store(MultipartFile file, String subfolder) {
        if (isSupabase()) {
            return supabaseStorageClient.upload(file, subfolder);
        }
        return "/uploads/" + fileStorageService.store(file, subfolder);
    }

    /** Takes whatever store() returned — this class resolves it back to whichever provider actually holds the file. */
    public void delete(String url) {
        if (url == null || url.isBlank()) return;

        if (isSupabase()) {
            supabaseStorageClient.delete(url);
            return;
        }

        String relativePath = url.startsWith("/uploads/") ? url.substring("/uploads/".length()) : url;
        fileStorageService.delete(relativePath);
    }

    private boolean isSupabase() {
        return "supabase".equalsIgnoreCase(provider);
    }
}
