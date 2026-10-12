package lk.ac.sliit.legacylens.common.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediaStorageServiceTest {

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private SupabaseStorageClient supabaseStorageClient;

    @Test
    void store_localProvider_delegatesToFileStorageService_andPrefixesUploadsPath() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "local");
        MockMultipartFile file = new MockMultipartFile("media", "clip.m4a", "audio/m4a", "x".getBytes());
        when(fileStorageService.store(file, "stories")).thenReturn("stories/generated.m4a");

        String url = mediaStorageService.store(file, "stories");

        assertThat(url).isEqualTo("/uploads/stories/generated.m4a");
        verify(supabaseStorageClient, never()).upload(any(), any());
    }

    @Test
    void store_supabaseProvider_delegatesToSupabaseStorageClient() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "supabase");
        MockMultipartFile file = new MockMultipartFile("media", "clip.m4a", "audio/m4a", "x".getBytes());
        when(supabaseStorageClient.upload(file, "stories"))
                .thenReturn("https://project.supabase.co/storage/v1/object/public/story-media/stories/generated.m4a");

        String url = mediaStorageService.store(file, "stories");

        assertThat(url).isEqualTo("https://project.supabase.co/storage/v1/object/public/story-media/stories/generated.m4a");
        verify(fileStorageService, never()).store(any(), any());
    }

    @Test
    void store_withExplicitBucket_localProvider_foldsBucketIntoThePath() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "local");
        MockMultipartFile file = new MockMultipartFile("media", "cover.jpg", "image/jpeg", "x".getBytes());
        when(fileStorageService.store(file, "story-thumbnail/covers")).thenReturn("story-thumbnail/covers/generated.jpg");

        String url = mediaStorageService.store(file, "story-thumbnail", "covers");

        assertThat(url).isEqualTo("/uploads/story-thumbnail/covers/generated.jpg");
        verify(supabaseStorageClient, never()).upload(any(), any(), any());
    }

    @Test
    void store_withExplicitBucket_supabaseProvider_passesTheBucketThrough() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "supabase");
        MockMultipartFile file = new MockMultipartFile("media", "cover.jpg", "image/jpeg", "x".getBytes());
        when(supabaseStorageClient.upload(file, "story-thumbnail", "covers"))
                .thenReturn("https://project.supabase.co/storage/v1/object/public/story-thumbnail/covers/generated.jpg");

        String url = mediaStorageService.store(file, "story-thumbnail", "covers");

        assertThat(url).isEqualTo("https://project.supabase.co/storage/v1/object/public/story-thumbnail/covers/generated.jpg");
        verify(fileStorageService, never()).store(any(), any());
    }

    @Test
    void store_providerNameIsCaseInsensitive() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "SUPABASE");
        MockMultipartFile file = new MockMultipartFile("media", "clip.m4a", "audio/m4a", "x".getBytes());
        when(supabaseStorageClient.upload(any(), any())).thenReturn("https://project.supabase.co/x");

        mediaStorageService.store(file, "stories");

        verify(supabaseStorageClient).upload(file, "stories");
    }

    @Test
    void delete_localProvider_stripsUploadsPrefix_beforeDelegating() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "local");

        mediaStorageService.delete("/uploads/stories/existing.m4a");

        verify(fileStorageService).delete("stories/existing.m4a");
        verify(supabaseStorageClient, never()).delete(any());
    }

    @Test
    void delete_supabaseProvider_passesTheUrlThrough() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "supabase");
        String url = "https://project.supabase.co/storage/v1/object/public/story-media/stories/existing.m4a";

        mediaStorageService.delete(url);

        verify(supabaseStorageClient).delete(url);
        verify(fileStorageService, never()).delete(any());
    }

    @Test
    void delete_blankUrl_isANoOp() {
        MediaStorageService mediaStorageService = new MediaStorageService(fileStorageService, supabaseStorageClient, "local");

        mediaStorageService.delete(null);
        mediaStorageService.delete("");

        verify(fileStorageService, never()).delete(any());
        verify(supabaseStorageClient, never()).delete(any());
    }
}
