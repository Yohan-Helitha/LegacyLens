package lk.ac.sliit.legacylens.common.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lk.ac.sliit.legacylens.common.exception.FileStorageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Where media files are actually stored, switched by app.storage.provider
 * (STORAGE_PROVIDER env var) — "local" (default, FileStorageService under
 * /uploads/**) or "supabase" (SupabaseStorageClient). Every caller gets back
 * a complete, playable URL either way, and passes that same URL back to
 * delete() — neither caller needs to know which provider is active, or
 * which bucket a given URL lives in.
 *
 * Any feature that uploads media can use this — not just today's two
 * callers (StoryServiceImpl, JobRequestServiceImpl). A caller happy with the
 * configured default bucket (app.storage.supabase.bucket, currently
 * "story-media") uses the one-arg store()/delete(); a caller that needs its
 * own bucket (story thumbnails, cultural-map assets, app icons, …) passes
 * that bucket name explicitly via the three-arg store(). Bucket names are
 * stable per-feature, not an environment secret, so they belong as a
 * constant in that feature's own service (same pattern as MEDIA_SUBFOLDER in
 * StoryServiceImpl), not as a new property here — just create the bucket in
 * Supabase (public, so uploaded URLs are directly playable) and pass its
 * name in. Creator-proof documents, payment proofs, work materials and
 * voice replies are the one exception: those stay on local disk only,
 * regardless of provider — they were never folded into this class.
 */
@Service
public class MediaStorageService {

    private static final Logger log = LoggerFactory.getLogger(MediaStorageService.class);

    private final FileStorageService fileStorageService;
    private final SupabaseStorageClient supabaseStorageClient;
    private final String provider;
    private final String blogBucket;
    private final String modelBucket;

    public MediaStorageService(
            FileStorageService fileStorageService,
            SupabaseStorageClient supabaseStorageClient,
            @Value("${app.storage.provider:local}") String provider) {
        this(fileStorageService, supabaseStorageClient, provider, "blog_image", "cultural-model");
    }

    @org.springframework.beans.factory.annotation.Autowired
    public MediaStorageService(
            FileStorageService fileStorageService,
            SupabaseStorageClient supabaseStorageClient,
            @Value("${app.storage.provider:local}") String provider,
            @Value("${app.storage.supabase.blog-bucket:blog_image}") String blogBucket,
            @Value("${app.storage.supabase.model-bucket:cultural-model}") String modelBucket) {
        this.fileStorageService = fileStorageService;
        this.supabaseStorageClient = supabaseStorageClient;
        this.provider = provider;
        this.blogBucket = (blogBucket != null && !blogBucket.isBlank()) ? blogBucket : "blog_image";
        this.modelBucket = (modelBucket != null && !modelBucket.isBlank()) ? modelBucket : "cultural-model";
    }

    /** Stores to the configured default bucket (app.storage.supabase.bucket) and returns a complete, playable URL. */
    public String store(MultipartFile file, String subfolder) {
        if (isSupabase()) {
            return supabaseStorageClient.upload(file, subfolder);
        }
        return "/uploads/" + fileStorageService.store(file, subfolder);
    }

    /** Stores image files specifically into the dedicated blog_image bucket. */
    public String storeBlogImage(MultipartFile file, String subfolder) {
        return store(file, blogBucket, subfolder);
    }

    /** Stores 3D model files specifically into the dedicated cultural-model bucket. */
    public String storeModelFile(MultipartFile file, String subfolder) {
        return store(file, modelBucket, subfolder);
    }

    /**
     * Like {@link #store(MultipartFile, String)}, but into the given bucket
     * instead of the configured default — for a feature that needs its own
     * Supabase bucket. On the local provider there's no real bucket
     * concept, so `bucket` is just folded into the stored path, keeping the
     * same per-feature separation in dev as in production.
     */
    public String store(MultipartFile file, String bucket, String subfolder) {
        if (isSupabase()) {
            try {
                return supabaseStorageClient.upload(file, bucket, subfolder);
            } catch (FileStorageException ex) {
                if (ex.getMessage() != null && ex.getMessage().contains("50MB")) {
                    log.warn("File '{}' (size {} bytes) exceeded Supabase 50MB limit. Gracefully falling back to local server storage.",
                            file.getOriginalFilename(), file.getSize());
                    return "/uploads/" + fileStorageService.store(file, bucket + "/" + subfolder);
                }
                throw ex;
            }
        }
        return "/uploads/" + fileStorageService.store(file, bucket + "/" + subfolder);
    }

    /**
     * Takes whatever a store() call returned — this class resolves it back
     * to whichever provider (and, on Supabase, whichever bucket) actually
     * holds the file, so callers never need to pass the bucket back in.
     */
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
