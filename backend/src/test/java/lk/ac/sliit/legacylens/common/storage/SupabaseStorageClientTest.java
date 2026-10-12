package lk.ac.sliit.legacylens.common.storage;

import lk.ac.sliit.legacylens.common.exception.FileStorageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.matchesPattern;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class SupabaseStorageClientTest {

    private static final String PROJECT_URL = "https://test-project.supabase.co";
    private static final String SERVICE_KEY = "super-secret-service-role-key";
    private static final String BUCKET = "story-media";

    private SupabaseStorageProperties properties;
    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        properties = new SupabaseStorageProperties();
        properties.setUrl(PROJECT_URL);
        properties.setServiceKey(SERVICE_KEY);
        properties.setBucket(BUCKET);

        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
    }

    private SupabaseStorageClient newClient() {
        return new SupabaseStorageClient(properties, restClientBuilder);
    }

    /** The uploaded object name is a random UUID, so the request URL can only be matched by pattern, not exact value. */
    private String uploadUrlPattern(String subfolder, String extension) {
        String prefix = java.util.regex.Pattern.quote(PROJECT_URL + "/storage/v1/object/" + BUCKET + "/" + subfolder + "/");
        return prefix + "[0-9a-fA-F-]{36}" + java.util.regex.Pattern.quote(extension);
    }

    @Test
    void upload_success_returnsThePublicUrl_underTheGivenSubfolder() {
        mockServer.expect(requestTo(matchesPattern(uploadUrlPattern("stories", ".m4a"))))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer " + SERVICE_KEY))
                .andRespond(withSuccess("{\"Key\":\"story-media/stories/x.m4a\"}", MediaType.APPLICATION_JSON));

        MockMultipartFile file = new MockMultipartFile("media", "clip.m4a", "audio/m4a", "hello".getBytes());

        String publicUrl = newClient().upload(file, "stories");

        assertThat(publicUrl).startsWith(PROJECT_URL + "/storage/v1/object/public/" + BUCKET + "/stories/");
        assertThat(publicUrl).endsWith(".m4a");
        mockServer.verify();
    }

    @Test
    void upload_neverLeaksTheServiceKey_inAFailureMessage() {
        mockServer.expect(requestTo(matchesPattern(uploadUrlPattern("stories", ".m4a")))).andRespond(withServerError());

        MockMultipartFile file = new MockMultipartFile("media", "clip.m4a", "audio/m4a", "hello".getBytes());

        FileStorageException ex = assertThrows(FileStorageException.class, () -> newClient().upload(file, "stories"));

        assertThat(ex.getMessage()).doesNotContain(SERVICE_KEY);
    }

    @Test
    void upload_blankEndpoint_throwsCleanlyWithoutARealCall() {
        properties.setUrl("");
        MockMultipartFile file = new MockMultipartFile("media", "clip.m4a", "audio/m4a", "hello".getBytes());

        FileStorageException ex = assertThrows(FileStorageException.class, () -> newClient().upload(file, "stories"));

        assertThat(ex.getMessage()).isEqualTo("Supabase storage isn't configured yet.");
    }

    @Test
    void delete_publicUrlFromThisBucket_deletesByItsObjectPath() {
        String publicUrl = PROJECT_URL + "/storage/v1/object/public/" + BUCKET + "/stories/existing.m4a";
        mockServer.expect(requestTo(PROJECT_URL + "/storage/v1/object/" + BUCKET + "/stories/existing.m4a"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(header("Authorization", "Bearer " + SERVICE_KEY))
                .andRespond(withSuccess());

        newClient().delete(publicUrl);

        mockServer.verify();
    }

    @Test
    void delete_urlNotFromThisBucket_isANoOp() {
        // No expectation registered — if the client made a request anyway, mockServer.verify() below would fail.
        newClient().delete("https://somewhere-else.example.com/file.m4a");

        mockServer.verify();
    }

    @Test
    void delete_serverError_isSwallowed_bestEffort() {
        String publicUrl = PROJECT_URL + "/storage/v1/object/public/" + BUCKET + "/stories/existing.m4a";
        mockServer.expect(requestTo(PROJECT_URL + "/storage/v1/object/" + BUCKET + "/stories/existing.m4a"))
                .andRespond(withServerError());

        newClient().delete(publicUrl); // must not throw

        mockServer.verify();
    }
}
