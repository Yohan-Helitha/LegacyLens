package lk.ac.sliit.legacylens.common.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Only read when app.storage.provider=supabase — see MediaStorageService. */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.storage.supabase")
public class SupabaseStorageProperties {

    /** Project URL, e.g. https://ijtmikcskmjxubyeqrfa.supabase.co — no trailing slash required. */
    private String url;

    /** The project's service_role key. Server-side only — never log this, never return it to a client. */
    private String serviceKey;

    /**
     * Default bucket — used only by the one-arg store()/upload() overloads
     * (today's two callers: story media and hire-request voice notes). A
     * caller that needs a different bucket (thumbnails, cultural-map
     * assets, …) passes its own bucket name explicitly instead of adding a
     * new property here; bucket names are stable per-feature, not an
     * environment secret, so they belong in that feature's own code — see
     * MediaStorageService.store(file, bucket, subfolder).
     */
    private String bucket;
}
