package lk.ac.sliit.legacylens.config;

import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves uploaded media straight off disk at /uploads/**, backed by
 * FileStorageService's root directory. Kept public (see SecurityConfig) so
 * a <Video>/<Audio> element in the mobile app can hit the URL directly
 * without attaching an Authorization header.
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
                .addResourceLocations(location);
    }
}
