package lk.ac.sliit.legacylens.marketplace.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetailsService;
import lk.ac.sliit.legacylens.auth.security.JwtAuthenticationFilter;
import lk.ac.sliit.legacylens.auth.security.JwtService;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.config.SecurityConfig;
import lk.ac.sliit.legacylens.config.WebMvcConfig;
import lk.ac.sliit.legacylens.marketplace.service.CreatorProofService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The real security rules around verification documents: the stored files are
 * unreachable, creating a link needs a login, and a made-up link opens nothing.
 */
@WebMvcTest(CreatorProofController.class)
@Import({SecurityConfig.class, WebMvcConfig.class, JwtAuthenticationFilter.class, CreatorProofAccessTest.Storage.class})
class CreatorProofAccessTest {

    private static Path uploadRoot;

    @TestConfiguration
    static class Storage {
        @Bean
        FileStorageService fileStorageService() throws IOException {
            uploadRoot = Files.createTempDirectory("uploads");
            Files.createDirectories(uploadRoot.resolve("creator-proofs"));
            Files.writeString(uploadRoot.resolve("creator-proofs/nic.png"), "secret");
            Files.createDirectories(uploadRoot.resolve("stories"));
            Files.writeString(uploadRoot.resolve("stories/clip.m4a"), "audio");
            return new FileStorageService(uploadRoot.toString());
        }
    }

    @Autowired private MockMvc mockMvc;

    @MockBean private CreatorProofService proofService;
    @MockBean private JwtService jwtService;
    @MockBean private CustomUserDetailsService userDetailsService;

    @Test
    void theStoredProofFiles_cannotBeFetchedDirectly() throws Exception {
        mockMvc.perform(get("/uploads/creator-proofs/nic.png")).andExpect(status().is4xxClientError());
    }

    @Test
    void otherUploadedMedia_staysAvailableToThePlayers() throws Exception {
        mockMvc.perform(get("/uploads/stories/clip.m4a")).andExpect(status().isOk());
    }

    @Test
    void creatingALink_requiresALogin() throws Exception {
        mockMvc.perform(post("/api/creator-proofs/link")).andExpect(status().is4xxClientError());
    }

    @Test
    void aMadeUpLink_opensNothing() throws Exception {
        when(proofService.open("made-up")).thenThrow(new ResourceNotFoundException("Document not found"));

        mockMvc.perform(get("/api/creator-proofs/made-up")).andExpect(status().isNotFound());
    }
}
