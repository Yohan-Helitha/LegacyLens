package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.admin.dto.AdminNotificationResponse;
import lk.ac.sliit.legacylens.admin.service.AdminNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminNotificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminNotificationService adminNotificationService;

    @InjectMocks
    private AdminNotificationController adminNotificationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminNotificationController).build();
    }

    @Test
    void getNotifications_returnsNotificationsList() throws Exception {
        String id = UUID.randomUUID().toString();
        AdminNotificationResponse notification = AdminNotificationResponse.builder()
                .id(id)
                .title("New Story Pending Moderation")
                .subtitle("Moderation Queue")
                .body("A video submission from Galle needs review.")
                .type("moderation")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(adminNotificationService.getAdminNotifications()).thenReturn(List.of(notification));

        mockMvc.perform(get("/api/admin/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("New Story Pending Moderation")))
                .andExpect(jsonPath("$[0].type", is("moderation")))
                .andExpect(jsonPath("$[0].read", is(false)));

        verify(adminNotificationService).getAdminNotifications();
    }

    @Test
    void markAsRead_marksNotificationAsReadSuccessfully() throws Exception {
        String id = UUID.randomUUID().toString();

        mockMvc.perform(put("/api/admin/notifications/{type}/{id}/read", "moderation", id))
                .andExpect(status().isOk());

        verify(adminNotificationService).markNotificationAsRead("moderation", id);
    }

    @Test
    void markAllAsRead_marksAllAsReadSuccessfully() throws Exception {
        mockMvc.perform(put("/api/admin/notifications/read-all"))
                .andExpect(status().isOk());

        verify(adminNotificationService).markAllAsRead();
    }
}

