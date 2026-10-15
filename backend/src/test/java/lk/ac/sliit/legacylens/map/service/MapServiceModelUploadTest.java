package lk.ac.sliit.legacylens.map.service;

import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.common.storage.MediaStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MapServiceModelUploadTest {

    @Mock
    private MediaStorageService mediaStorageService;
    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private MapService mapService;

    @Test
    void modelUploadsGoToTheCulturalModelBucketAndReturnTheCompleteUrl() {
        MockMultipartFile glb = new MockMultipartFile("file", "temple.glb", "model/gltf-binary", new byte[] {1, 2, 3});
        String publicUrl = "https://example.supabase.co/storage/v1/object/public/cultural-model/models/abc.glb";
        when(mediaStorageService.storeModelFile(glb, "models")).thenReturn(publicUrl);

        String result = mapService.uploadModelFile(glb);

        assertThat(result).isEqualTo(publicUrl);
        verify(mediaStorageService).storeModelFile(glb, "models");
        verifyNoInteractions(fileStorageService);
    }

    @Test
    void badgeImagesStillUseLocalFileStorage() {
        MockMultipartFile png = new MockMultipartFile("file", "badge.png", "image/png", new byte[] {1});
        when(fileStorageService.store(png, "badges")).thenReturn("badges/x.png");

        assertThat(mapService.uploadBadgeImage(png)).isEqualTo("badges/x.png");
        verifyNoInteractions(mediaStorageService);
    }
}
