package lk.ac.sliit.legacylens.map.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.map.dto.*;
import lk.ac.sliit.legacylens.map.service.MapService;
import lk.ac.sliit.legacylens.users.entity.AccountStatus;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MapControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MapService mapService;

    @InjectMocks
    private MapController mapController;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UUID testUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setId(testUserId);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setRoles(Collections.emptyList());
        CustomUserDetails testUserDetails = new CustomUserDetails(user);

        HandlerMethodArgumentResolver customUserDetailsResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return CustomUserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return testUserDetails;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(mapController)
                .setCustomArgumentResolvers(customUserDetailsResolver)
                .build();
    }

    @Test
    void getMapboxToken_returnsTokenResponse() throws Exception {
        mockMvc.perform(get("/api/map/token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Mapbox token retrieved")));
    }

    @Test
    void getAllLandmarks_returnsLandmarksList() throws Exception {
        MapLandmarkResponse l1 = MapLandmarkResponse.builder()
                .id("sigiriya")
                .name("Sigiriya Rock")
                .lat(7.957)
                .lng(80.760)
                .build();

        when(mapService.getAllLandmarks()).thenReturn(List.of(l1));

        mockMvc.perform(get("/api/map/landmarks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is("sigiriya")))
                .andExpect(jsonPath("$.data[0].name", is("Sigiriya Rock")));
    }

    @Test
    void getAllRegions_returnsRegionsList() throws Exception {
        RegionResponse r1 = RegionResponse.builder()
                .id(1L)
                .code("central")
                .label("Central Highlands")
                .build();

        when(mapService.getAllRegions()).thenReturn(List.of(r1));

        mockMvc.perform(get("/api/map/regions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].code", is("central")));
    }

    @Test
    void getAllBadges_returnsBadgesList() throws Exception {
        BadgeResponse b1 = BadgeResponse.builder()
                .id("badge-1")
                .title("Temple Explorer")
                .build();

        when(mapService.getAllBadges()).thenReturn(List.of(b1));

        mockMvc.perform(get("/api/map/badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is("badge-1")));
    }

    @Test
    void getQuestionsForQuest_returnsQuestQuestions() throws Exception {
        QuestionResponse q1 = QuestionResponse.builder()
                .riddle("Which mountain is known as Sri Pada?")
                .build();

        when(mapService.getQuestionsForQuest(10L)).thenReturn(List.of(q1));

        mockMvc.perform(get("/api/map/quests/{questId}/questions", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].riddle", is("Which mountain is known as Sri Pada?")));
    }

    @Test
    void getMyBadges_returnsUserUnlockedBadges() throws Exception {
        when(mapService.getMyBadges(testUserId)).thenReturn(List.of("badge-sigiriya", "badge-galle"));

        mockMvc.perform(get("/api/map/my-badges"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0]", is("badge-sigiriya")));
    }

    @Test
    void unlockBadge_delegatesToServiceAndReturnsOk() throws Exception {
        mockMvc.perform(post("/api/map/my-badges/{badgeCode}", "badge-sigiriya"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is("badge-sigiriya")));

        verify(mapService).unlockBadge(testUserId, "badge-sigiriya");
    }

    @Test
    void createLandmark_validRequest_returnsCreatedLandmark() throws Exception {
        CreateLandmarkRequest request = new CreateLandmarkRequest();
        request.setName("Dambulla Cave");
        request.setDescription("Golden Temple of Dambulla");
        request.setRegion("Central Province");

        MapLandmarkResponse response = MapLandmarkResponse.builder()
                .id("dambulla-cave")
                .name("Dambulla Cave")
                .build();

        when(mapService.createLandmark(any(CreateLandmarkRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/map/landmarks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is("dambulla-cave")));
    }

    @Test
    void updateLandmark_validRequest_returnsUpdatedLandmark() throws Exception {
        CreateLandmarkRequest request = new CreateLandmarkRequest();
        request.setName("Updated Dambulla");
        request.setRegion("Central Province");

        MapLandmarkResponse response = MapLandmarkResponse.builder()
                .id("dambulla-cave")
                .name("Updated Dambulla")
                .build();

        when(mapService.updateLandmark(eq(10L), any(CreateLandmarkRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/map/landmarks/{id}", 10L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Updated Dambulla")));
    }

    @Test
    void deleteLandmark_delegatesToServiceAndReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/map/landmarks/{id}", 15L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Landmark deleted successfully")));

        verify(mapService).deleteLandmark(15L);
    }

    @Test
    void deleteQuest_delegatesToServiceAndReturnsOk() throws Exception {
        mockMvc.perform(delete("/api/map/quests/{id}", 20L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Quest deleted successfully")));

        verify(mapService).deleteQuest(20L);
    }
}

