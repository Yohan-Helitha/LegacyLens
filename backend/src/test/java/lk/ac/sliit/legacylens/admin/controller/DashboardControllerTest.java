package lk.ac.sliit.legacylens.admin.controller;

import lk.ac.sliit.legacylens.admin.dto.DashboardStatsDTO;
import lk.ac.sliit.legacylens.admin.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DashboardService dashboardService;

    @InjectMocks
    private DashboardController dashboardController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(dashboardController).build();
    }

    @Test
    void getDashboardStats_returnsSuccessResponseWithStats() throws Exception {
        DashboardStatsDTO statsDTO = DashboardStatsDTO.builder()
                .totalUsers(128)
                .pendingVerifications(14)
                .verifiedUsers(94)
                .suspendedUsers(4)
                .totalAdmins(6)
                .activeAdmins(5)
                .totalStories(250)
                .pendingModeration(12)
                .publishedStories(220)
                .rejectedStories(15)
                .archivedStories(3)
                .build();

        when(dashboardService.getDashboardStats()).thenReturn(statsDTO);

        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Dashboard statistics retrieved successfully")))
                .andExpect(jsonPath("$.data.totalUsers", is(128)))
                .andExpect(jsonPath("$.data.pendingVerifications", is(14)))
                .andExpect(jsonPath("$.data.verifiedUsers", is(94)))
                .andExpect(jsonPath("$.data.suspendedUsers", is(4)))
                .andExpect(jsonPath("$.data.totalAdmins", is(6)))
                .andExpect(jsonPath("$.data.totalStories", is(250)))
                .andExpect(jsonPath("$.data.pendingModeration", is(12)))
                .andExpect(jsonPath("$.data.publishedStories", is(220)));

        verify(dashboardService).getDashboardStats();
    }
}

