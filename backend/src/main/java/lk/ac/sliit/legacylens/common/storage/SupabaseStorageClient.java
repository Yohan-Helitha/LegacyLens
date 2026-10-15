package lk.ac.sliit.legacylens.common.storage;

import lk.ac.sliit.legacylens.common.exception.FileStorageException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The only class that knows Supabase Storage's REST API shape — mirrors
 * AzureFastTranscriptionProvider's role for the speech feature. Used by
 * MediaStorageService, and only when app.storage.provider=supabase.
 *
 * Not scoped to one bucket: every call takes the bucket it should use, so
 * different features (story media, future thumbnails, cultural-map assets,
 * …) can each point at their own Supabase bucket without this class or its
 * config changing. {@link SupabaseStorageProperties#getBucket()} is only a
 * fallback default, used by the one-arg overloads that today's two callers
 * (StoryServiceImpl, JobRequestServiceImpl) rely on.
 *
 * Supabase Storage's REST API (not the S3-compatible one — SUPABASE_URL/
 * SUPABASE_SERVICE_KEY are its native credential shape, not S3 access
 * keys):
 *   upload: POST {url}/storage/v1/object/{bucket}/{path}, body = raw bytes
 *   delete: DELETE {url}/storage/v1/object/{bucket}/{path}
 *   both authenticated with "Authorization: Bearer {service_role key}"
 * Whichever bucket is passed in must be public for the URL this returns to
 * be playable without a signed-URL step — see this project's own
 * storage-bucket setup.
 */
@Component
public class SupabaseStorageClient {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageClient.class);
    private static final Pattern SAFE_EXTENSION = Pattern.compile("^\\.[A-Za-z0-9]{1,10}$");
    /** Pulls {bucket} and {path} out of a public URL this class produced — see publicUrl(). */
    private static final Pattern PUBLIC_URL_PATTERN = Pattern.compile("/storage/v1/object/public/([^/]+)/(.+)$");

    private final SupabaseStorageProperties properties;
    private final RestClient restClient;

    public SupabaseStorageClient(SupabaseStorageProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    /** Uploads to {@link SupabaseStorageProperties#getBucket()} — the configured default bucket. */
    public String upload(MultipartFile file, String subfolder) {
        return upload(file, properties.getBucket(), subfolder);
    }

    /** Uploads under a random name (the original filename is never trusted) into the given bucket, and returns the file's public URL. */
    public String upload(MultipartFile file, String bucket, String subfolder) {
        String objectPath = subfolder + "/" + UUID.randomUUID() + safeExtension(file.getOriginalFilename());
        // Resolved outside the try below so a blank-endpoint FileStorageException
        // surfaces as itself, not re-wrapped by that block's generic catch.
        String uploadUrl = objectUrl(bucket, objectPath);

        try {
            restClient.post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + properties.getServiceKey())
                    .contentType(resolveContentType(file))
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();
        } catch (IOException ex) {
            throw new FileStorageException("Could not read the uploaded file", ex);
        } catch (Exception ex) {
            // Never surface the response body — Supabase error payloads can echo request details.
            throw new FileStorageException("Could not upload the file to storage", ex);
        }

        return publicUrl(bucket, objectPath);
    }

    /**
     * Best-effort — matches FileStorageService.delete's own contract. The
     * bucket is read straight out of the URL (it's whatever publicUrl()
     * embedded in it), not from config, so this deletes correctly no matter
     * which bucket the file was originally uploaded to. Silently no-ops on a
     * URL that isn't a Supabase public object URL this client's shape
     * produces.
     */
    public void delete(String publicUrl) {
        if (publicUrl == null || publicUrl.isBlank()) return;

        Matcher matcher = PUBLIC_URL_PATTERN.matcher(publicUrl);
        if (!matcher.find()) return;
        String bucket = matcher.group(1);
        String objectPath = matcher.group(2);

        try {
            restClient.delete()
                    .uri(objectUrl(bucket, objectPath))
                    .header("Authorization", "Bearer " + properties.getServiceKey())
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.warn("Could not delete {}/{} from Supabase Storage: {}", bucket, objectPath, ex.getMessage());
        }
    }

    private String objectUrl(String bucket, String objectPath) {
        return normalizedBaseUrl() + "/storage/v1/object/" + bucket + "/" + objectPath;
    }

    private String publicUrl(String bucket, String objectPath) {
        return normalizedBaseUrl() + "/storage/v1/object/public/" + bucket + "/" + objectPath;
    }

    private String normalizedBaseUrl() {
        String url = properties.getUrl();
        if (url == null || url.isBlank()) {
            throw new FileStorageException("Supabase storage isn't configured yet.");
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private MediaType resolveContentType(MultipartFile file) {
        if (file.getContentType() == null || file.getContentType().isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(file.getContentType());
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    /** Same safety rule as FileStorageService: never trust the original filename beyond a short, plain extension. */
    private String safeExtension(String originalFilename) {
        if (originalFilename == null) return "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot < 0) return "";
        String extension = originalFilename.substring(dot).toLowerCase();
        return SAFE_EXTENSION.matcher(extension).matches() ? extension : "";
    }
}
