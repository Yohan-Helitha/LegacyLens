package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminOpportunityResponse;
import lk.ac.sliit.legacylens.admin.dto.CreateOpportunityRequest;
import lk.ac.sliit.legacylens.admin.dto.OpportunityAudioResponse;
import lk.ac.sliit.legacylens.admin.dto.UpdateOpportunityStatusRequest;
import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import lk.ac.sliit.legacylens.admin.repository.OpportunityAudioRepository;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.hiring.repository.JobRequestRepository;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.moderation.service.GroqAiService;
import lk.ac.sliit.legacylens.speech.service.TranscriptionService;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminOpportunityServiceTest {

    @Mock private OpportunityAudioRepository opportunityAudioRepository;
    @Mock private OpportunityRepository opportunityRepository;
    @Mock private UserRepository userRepository;
    @Mock private AdminAuditService auditService;
    @Mock private ApplicationEventPublisher events;
    @Mock private JobRequestRepository jobRequestRepository;
    @Mock private TranscriptionService transcriptionService;
    @Mock private GroqAiService groqAiService;
    @Mock private JdbcTemplate jdbcTemplate;

    private AdminOpportunityServiceImpl adminOpportunityService;

    @BeforeEach
    void setUp() {
        adminOpportunityService = new AdminOpportunityServiceImpl(
                opportunityAudioRepository,
                opportunityRepository,
                userRepository,
                auditService,
                events,
                jobRequestRepository,
                transcriptionService,
                groqAiService,
                jdbcTemplate
        );
    }

    @Test
    void getAudioSubmissions_returnsFilteredAudios() {
        OpportunityAudio audio = new OpportunityAudio();
        audio.setId(UUID.randomUUID());
        audio.setElderName("Gunadasa Kapuge");
        audio.setTopic("Folk Music of Ruhuna");
        audio.setLocation("Matara");
        audio.setStatus(AudioReviewStatus.UNLISTENED);
        audio.setCreatedAt(LocalDateTime.now());

        when(opportunityAudioRepository.findAll()).thenReturn(List.of(audio));

        List<OpportunityAudioResponse> result = adminOpportunityService.getAudioSubmissions("ALL");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getElderName()).isEqualTo("Gunadasa Kapuge");
        assertThat(result.get(0).getTopic()).isEqualTo("Folk Music of Ruhuna");
    }

    @Test
    void getAudioSubmission_found_returnsAudio() {
        UUID id = UUID.randomUUID();
        OpportunityAudio audio = new OpportunityAudio();
        audio.setId(id);
        audio.setElderName("Pabilis Silva");
        audio.setTopic("Culinary Heritage");
        audio.setStatus(AudioReviewStatus.UNLISTENED);

        when(opportunityAudioRepository.findById(id)).thenReturn(Optional.of(audio));

        OpportunityAudioResponse response = adminOpportunityService.getAudioSubmission(id.toString());

        assertThat(response).isNotNull();
        assertThat(response.getElderName()).isEqualTo("Pabilis Silva");
    }

    @Test
    void getAudioSubmission_notFound_throwsException() {
        UUID id = UUID.randomUUID();
        when(opportunityAudioRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminOpportunityService.getAudioSubmission(id.toString()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateAudioStatus_updatesStatusSuccessfully() {
        UUID id = UUID.randomUUID();
        OpportunityAudio audio = new OpportunityAudio();
        audio.setId(id);
        audio.setStatus(AudioReviewStatus.UNLISTENED);

        when(opportunityAudioRepository.findById(id)).thenReturn(Optional.of(audio));
        when(opportunityAudioRepository.save(any(OpportunityAudio.class))).thenAnswer(i -> i.getArgument(0));

        OpportunityAudioResponse response = adminOpportunityService.updateAudioStatus(id.toString(), "FULLY_LISTENED");

        assertThat(response.getStatus()).isEqualTo("FULLY_LISTENED");
        verify(opportunityAudioRepository).save(audio);
    }

    @Test
    void createOpportunity_savesAndReturnsOpportunity() {
        CreateOpportunityRequest request = new CreateOpportunityRequest();
        request.setTitle("Preserving Ancient Palm Leaf Inscriptions");
        request.setDescription("Document rare manuscripts in Kurunegala");
        request.setOfferedAmount(BigDecimal.valueOf(35000));
        request.setLocation("Kurunegala");
        request.setStatus("PUBLISHED");

        UUID generatedId = UUID.randomUUID();
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(i -> {
            Opportunity o = i.getArgument(0);
            o.setId(generatedId);
            return o;
        });

        AdminOpportunityResponse response = adminOpportunityService.createOpportunity(request, "admin-1", "Lead Admin");

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Preserving Ancient Palm Leaf Inscriptions");
        assertThat(response.getStatus()).isEqualTo("PUBLISHED");
        verify(opportunityRepository).save(any(Opportunity.class));
    }

    @Test
    void getAllOpportunities_returnsAllWhenStatusIsAll() {
        Opportunity opp1 = new Opportunity();
        opp1.setId(UUID.randomUUID());
        opp1.setTitle("Opp 1");
        opp1.setStatus(OpportunityStatus.PUBLISHED);

        Opportunity opp2 = new Opportunity();
        opp2.setId(UUID.randomUUID());
        opp2.setTitle("Opp 2");
        opp2.setStatus(OpportunityStatus.DRAFT);

        when(opportunityRepository.findAll()).thenReturn(List.of(opp1, opp2));

        List<AdminOpportunityResponse> result = adminOpportunityService.getAllOpportunities("ALL");

        assertThat(result).hasSize(2);
    }

    @Test
    void updateOpportunityStatus_updatesAndReturnsOpportunity() {
        UUID id = UUID.randomUUID();
        Opportunity opp = new Opportunity();
        opp.setId(id);
        opp.setTitle("Existing Opportunity");
        opp.setStatus(OpportunityStatus.PUBLISHED);

        when(opportunityRepository.findById(id)).thenReturn(Optional.of(opp));
        when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(i -> i.getArgument(0));

        UpdateOpportunityStatusRequest request = new UpdateOpportunityStatusRequest();
        request.setStatus("CLOSED");

        AdminOpportunityResponse response = adminOpportunityService.updateOpportunityStatus(id.toString(), request, "admin-1", "Admin");

        assertThat(response.getStatus()).isEqualTo("CLOSED");
        verify(opportunityRepository).save(opp);
    }
}
