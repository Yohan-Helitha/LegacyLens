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

    private String bucket;
}
