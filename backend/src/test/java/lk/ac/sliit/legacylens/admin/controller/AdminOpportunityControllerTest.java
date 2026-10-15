package lk.ac.sliit.legacylens.admin.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.OpportunityTranscriptionResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import lk.ac.sliit.legacylens.admin.service.AdminOpportunityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminOpportunityControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminOpportunityService adminOpportunityService;

    @InjectMocks
    private AdminOpportunityController adminOpportunityController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminOpportunityController)
                .setCustomArgumentResolvers(new org.springframework.web.method.support.HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(org.springframework.core.MethodParameter parameter) {
                        return parameter.getParameterType().equals(lk.ac.sliit.legacylens.auth.security.CustomUserDetails.class);
                    }

                    @Override
                    public Object resolveArgument(org.springframework.core.MethodParameter parameter,
                                                  org.springframework.web.method.support.ModelAndViewContainer mavContainer,
                                                  org.springframework.web.context.request.NativeWebRequest webRequest,
                                                  org.springframework.web.bind.support.WebDataBinderFactory binderFactory) {
                        return null;
                    }
                })
                .build();
    }

    @Test
    void getAudioSubmissions_returnsList() throws Exception {
        OpportunityAudioResponse audio = OpportunityAudioResponse.builder()
                .id(UUID.randomUUID().toString())
                .elderName("Nimal Karunaratne")
                .topic("Traditional Pottery")
                .location("Kandy")
                .status("PENDING")
                .build();

        when(adminOpportunityService.getAudioSubmissions("ALL")).thenReturn(List.of(audio));

        mockMvc.perform(get("/api/admin/opportunities/audios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].elderName", is("Nimal Karunaratne")))
                .andExpect(jsonPath("$.data[0].topic", is("Traditional Pottery")));

        verify(adminOpportunityService).getAudioSubmissions("ALL");
    }

    @Test
    void getAudioSubmission_returnsSingleAudio() throws Exception {
        String id = UUID.randomUUID().toString();
        OpportunityAudioResponse audio = OpportunityAudioResponse.builder()
                .id(id)
                .elderName("Sunil Perera")
                .topic("Kandyan Dance")
                .status("VERIFIED")
                .build();

        when(adminOpportunityService.getAudioSubmission(id)).thenReturn(audio);

        mockMvc.perform(get("/api/admin/opportunities/audios/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.elderName", is("Sunil Perera")))
                .andExpect(jsonPath("$.data.status", is("VERIFIED")));

        verify(adminOpportunityService).getAudioSubmission(id);
    }

    @Test
    void updateAudioStatus_updatesStatusSuccessfully() throws Exception {
        String id = UUID.randomUUID().toString();
        OpportunityAudioResponse audio = OpportunityAudioResponse.builder()
                .id(id)
                .status("VERIFIED")
                .build();

        when(adminOpportunityService.updateAudioStatus(id, "VERIFIED")).thenReturn(audio);

        mockMvc.perform(patch("/api/admin/opportunities/audios/{id}/status", id)
                        .param("status", "VERIFIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("VERIFIED")));

        verify(adminOpportunityService).updateAudioStatus(id, "VERIFIED");
    }

    @Test
    void autoTranscribeAudio_returnsTranscriptionResponse() throws Exception {
        String id = UUID.randomUUID().toString();
        OpportunityTranscriptionResponse response = OpportunityTranscriptionResponse.builder()
                .audioId(id)
                .fullSinhalaText("Sinhala audio narrative")
                .fullEnglishText("Auto transcribed cultural narrative text")
                .build();

        when(adminOpportunityService.transcribeAudio(id)).thenReturn(response);

        mockMvc.perform(post("/api/admin/opportunities/audios/{id}/transcribe", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullEnglishText", is("Auto transcribed cultural narrative text")));

        verify(adminOpportunityService).transcribeAudio(id);
    }

    @Test
    void createOpportunity_createsAndReturnsOpportunity() throws Exception {
        CreateOpportunityRequest request = new CreateOpportunityRequest();
        request.setTitle("Folk Song Recording Project");
        request.setDescription("Document historical songs from Jaffna");
        request.setOfferedAmount(BigDecimal.valueOf(25000));
        request.setLocation("Jaffna");
        request.setStatus("PUBLISHED");

        AdminOpportunityResponse response = AdminOpportunityResponse.builder()
                .id(UUID.randomUUID())
                .title("Folk Song Recording Project")
                .offeredAmount(BigDecimal.valueOf(25000))
                .status("PUBLISHED")
                .build();

        when(adminOpportunityService.createOpportunity(any(), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/admin/opportunities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-Admin-Id", "admin-1")
                        .header("X-Admin-Name", "Admin Lead"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Folk Song Recording Project")));
    }

    @Test
    void getAllOpportunities_returnsList() throws Exception {
        AdminOpportunityResponse opp = AdminOpportunityResponse.builder()
                .id(UUID.randomUUID())
                .title("Lacquer Work Documentation")
                .status("PUBLISHED")
                .build();

        when(adminOpportunityService.getAllOpportunities("ALL")).thenReturn(List.of(opp));

        mockMvc.perform(get("/api/admin/opportunities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title", is("Lacquer Work Documentation")));
    }

    @Test
    void updateOpportunityStatus_updatesStatus() throws Exception {
        String id = UUID.randomUUID().toString();
        UpdateOpportunityStatusRequest request = new UpdateOpportunityStatusRequest();
        request.setStatus("CLOSED");

        AdminOpportunityResponse response = AdminOpportunityResponse.builder()
                .id(UUID.fromString(id))
                .status("CLOSED")
                .build();

        when(adminOpportunityService.updateOpportunityStatus(eq(id), any(), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/admin/opportunities/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("CLOSED")));
    }
}
