package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.admin.service.AdminUserVerificationService;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetailsService;
import lk.ac.sliit.legacylens.auth.security.JwtAuthenticationFilter;
import lk.ac.sliit.legacylens.auth.security.JwtService;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.config.SecurityConfig;
import lk.ac.sliit.legacylens.config.WebMvcConfig;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The admin endpoints return every user's full NIC and phone number, so only
 * an ADMIN account may call them - not an elder, not a content creator.
 */
@WebMvcTest(AdminUserVerificationController.class)
@Import({SecurityConfig.class, WebMvcConfig.class, JwtAuthenticationFilter.class, AdminAccessRulesTest.Storage.class})
class AdminAccessRulesTest {

    @TestConfiguration
    static class Storage {
        @Bean
        FileStorageService fileStorageService() throws IOException {
            return new FileStorageService(Files.createTempDirectory("uploads").toString());
        }
    }

    @Autowired private MockMvc mockMvc;

    @MockBean private AdminUserVerificationService verificationService;
    @MockBean private JwtService jwtService;
    @MockBean private CustomUserDetailsService userDetailsService;

    @Test
    void anonymousCaller_isRejected() throws Exception {
        mockMvc.perform(get("/api/admin/verifications")).andExpect(status().is4xxClientError());
    }

    @Test
    void anElder_cannotListEveryonesNic() throws Exception {
        mockMvc.perform(get("/api/admin/verifications").with(user("elder").roles("ELDER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void aContentCreator_cannotListEveryonesNic() throws Exception {
        mockMvc.perform(get("/api/admin/verifications").with(user("creator").roles("YOUTH_CREATOR")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/verifications/" + UUID.randomUUID()).with(user("creator").roles("YOUTH_CREATOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    void anAdmin_canStillUseTheAdminEndpoints() throws Exception {
        when(verificationService.getAllVerifications("ALL", "ALL")).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/verifications").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }
}
