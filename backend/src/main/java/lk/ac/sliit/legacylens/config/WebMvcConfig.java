package lk.ac.sliit.legacylens.config;

import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

/**
 * Serves uploaded media straight off disk at /uploads/**, backed by
 * FileStorageService's root directory. Kept public (see SecurityConfig) so
 * a <Video>/<Audio> element in the mobile app can hit the URL directly
 * without attaching an Authorization header.
 *
 * Cache-Control is set to 7 days so that large assets (GLB models, badge
 * images, story clips) are served straight from the browser cache on repeat
 * visits instead of re-downloading from the server every time.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final FileStorageService fileStorageService;

    public WebMvcConfig(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Path#toUri() (not string concatenation) so this resolves correctly
        // on Windows too — "file:C:\foo\bar" isn't a valid resource location,
        // but "file:///C:/foo/bar/" is.
        String location = fileStorageService.getRootDir().toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic());
    }
}
