package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationRequest;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityStatus;
import lk.ac.sliit.legacylens.marketplace.repository.JobRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.messaging.service.ConversationOpener;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OpportunityApplicationServiceImplTest {

    @Mock private OpportunityApplicationRepository applicationRepository;
    @Mock private OpportunityRepository opportunityRepository;
    @Mock private UserRepository userRepository;
    @Mock private JobRepository jobRepository;
    @Mock private ConversationOpener conversationOpener;
    @Mock private org.springframework.context.ApplicationEventPublisher events;

    private OpportunityApplicationServiceImpl service;

    private final UUID creatorId = UUID.randomUUID();
    private Opportunity opportunity;

    @BeforeEach
    void setUp() {
        service = new OpportunityApplicationServiceImpl(
                applicationRepository, opportunityRepository, userRepository, jobRepository, conversationOpener,
                new OpportunityApplicationResponseMapper(), events);

        User creator = new User();
        creator.setId(creatorId);
        User elder = new User();
        elder.setId(UUID.randomUUID());
        elder.setFullName("Kamala Wijesinghe");

        opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setElder(elder);
        opportunity.setTitle("Traditional recipe documentation");

        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(opportunityRepository.findByIdAndStatus(opportunity.getId(), OpportunityStatus.PUBLISHED))
                .thenReturn(Optional.of(opportunity));
        when(applicationRepository.findByCreatorIdAndOpportunityId(creatorId, opportunity.getId()))
                .thenReturn(Optional.empty());
    }

    private OpportunityApplicationRequest request(List<String> languages) {
        OpportunityApplicationRequest request = new OpportunityApplicationRequest();
        request.setOpportunityId(opportunity.getId());
        request.setSkills(List.of("Photography"));
        request.setLanguages(languages);
        return request;
    }

    private void echoSavedApplication() {
        when(applicationRepository.save(any(OpportunityApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void saveDraft_storesTheLanguagesAndReturnsThemWithTheirLevels() {
        echoSavedApplication();

        OpportunityApplicationResponse response =
                service.saveDraft(creatorId, request(List.of("Sinhala:FLUENT", "English:basic")));

        assertThat(response.getLanguages())
                .extracting(language -> language.getLanguage() + ":" + language.getProficiency())
                .containsExactly("Sinhala:FLUENT", "English:BASIC");
    }

    @Test
    void saveDraft_withNoLanguages_isStillAValidDraft() {
        echoSavedApplication();

        OpportunityApplicationResponse response = service.saveDraft(creatorId, request(List.of()));

        assertThat(response.getLanguages()).isEmpty();
    }

    @Test
    void saveDraft_withALanguageButNoLevel_isRejectedAndNothingIsSaved() {
        assertThrows(InvalidRequestException.class,
                () -> service.saveDraft(creatorId, request(List.of("Tamil"))));

        verify(applicationRepository, never()).save(any());
    }

    @Test
    void saveDraft_withAnUnsupportedLanguage_isRejected() {
        assertThrows(InvalidRequestException.class,
                () -> service.saveDraft(creatorId, request(List.of("Klingon:FLUENT"))));
    }
}
