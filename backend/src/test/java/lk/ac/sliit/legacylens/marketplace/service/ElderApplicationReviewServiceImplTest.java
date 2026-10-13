package lk.ac.sliit.legacylens.marketplace.service;

import lk.ac.sliit.legacylens.common.exception.InvalidApplicationStateException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.dto.OpportunityApplicationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplication;
import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.marketplace.event.ApplicationDecidedEvent;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityApplicationRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ElderApplicationReviewServiceImplTest {

    @Mock private OpportunityApplicationRepository applicationRepository;
    @Mock private ApplicationEventPublisher events;

    private ElderApplicationReviewServiceImpl service;

    private User elder;
    private User creator;
    private OpportunityApplication application;

    @BeforeEach
    void setUp() {
        service = new ElderApplicationReviewServiceImpl(applicationRepository, new OpportunityApplicationResponseMapper(), events);

        elder = new User();
        elder.setId(UUID.randomUUID());
        elder.setFullName("Kamala Wijesinghe");
        creator = new User();
        creator.setId(UUID.randomUUID());
        creator.setFullName("Nimal Perera");

        Opportunity opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setElder(elder);
        opportunity.setTitle("Traditional recipe documentation");

        application = new OpportunityApplication();
        application.setId(UUID.randomUUID());
        application.setCreator(creator);
        application.setOpportunity(opportunity);
        application.setStatus(OpportunityApplicationStatus.PENDING);
    }

    private void owns(UUID elderId) {
        when(applicationRepository.findByIdAndOpportunityElderId(application.getId(), elderId))
                .thenReturn(Optional.of(application));
    }

    @Test
    void approve_byTheOwningElder_movesAPendingApplicationToApproved() {
        owns(elder.getId());
        when(applicationRepository.save(any(OpportunityApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OpportunityApplicationResponse response = service.approve(elder.getId(), application.getId());

        assertThat(response.getStatus()).isEqualTo("APPROVED");
        assertThat(response.getCreatorName()).isEqualTo("Nimal Perera");
        assertThat(application.getStatus()).isEqualTo(OpportunityApplicationStatus.APPROVED);
    }

    @Test
    void aDecision_tellsTheCreator_throughAnEvent() {
        owns(elder.getId());
        when(applicationRepository.save(any(OpportunityApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.reject(elder.getId(), application.getId());

        ArgumentCaptor<ApplicationDecidedEvent> sent = ArgumentCaptor.forClass(ApplicationDecidedEvent.class);
        verify(events).publishEvent(sent.capture());
        assertThat(sent.getValue().creatorId()).isEqualTo(creator.getId());
        assertThat(sent.getValue().decision()).isEqualTo(OpportunityApplicationStatus.REJECTED);
        assertThat(sent.getValue().opportunityTitle()).isEqualTo("Traditional recipe documentation");
    }

    @Test
    void aDecisionThatIsNotAllowed_tellsNobody() {
        application.setStatus(OpportunityApplicationStatus.APPROVED);
        owns(elder.getId());

        assertThrows(InvalidApplicationStateException.class, () -> service.reject(elder.getId(), application.getId()));
        verify(events, never()).publishEvent(any(Object.class));
    }

    @Test
    void reject_byTheOwningElder_movesAPendingApplicationToRejected() {
        owns(elder.getId());
        when(applicationRepository.save(any(OpportunityApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.reject(elder.getId(), application.getId()).getStatus()).isEqualTo("REJECTED");
    }

    @Test
    void anotherUser_cannotDecide_andIsToldItDoesNotExist() {
        UUID someoneElse = UUID.randomUUID();
        when(applicationRepository.findByIdAndOpportunityElderId(application.getId(), someoneElse))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.approve(someoneElse, application.getId()));
        assertThrows(ResourceNotFoundException.class, () -> service.reject(someoneElse, application.getId()));
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void theCreatorThemselves_isNotTheOwner_soCannotUseTheElderEndpoint() {
        when(applicationRepository.findByIdAndOpportunityElderId(application.getId(), creator.getId()))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.approve(creator.getId(), application.getId()));
    }

    @Test
    void anApplicationAlreadyDecided_cannotBeDecidedAgain() {
        application.setStatus(OpportunityApplicationStatus.APPROVED);
        owns(elder.getId());

        assertThrows(InvalidApplicationStateException.class, () -> service.reject(elder.getId(), application.getId()));
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void aDraft_cannotBeDecided() {
        application.setStatus(OpportunityApplicationStatus.SAVED);
        owns(elder.getId());

        assertThrows(InvalidApplicationStateException.class, () -> service.approve(elder.getId(), application.getId()));
    }

    @Test
    void theElderList_isAskedForSubmittedApplicationsOnly_neverDrafts() {
        when(applicationRepository.findByOpportunityElderIdAndStatusInOrderBySubmittedAtDesc(
                org.mockito.ArgumentMatchers.eq(elder.getId()), anyCollection())).thenReturn(List.of(application));

        List<OpportunityApplicationResponse> list = service.getApplicationsForElder(elder.getId());

        assertThat(list).hasSize(1);
        org.mockito.ArgumentCaptor<java.util.Collection<OpportunityApplicationStatus>> statuses =
                org.mockito.ArgumentCaptor.forClass(java.util.Collection.class);
        verify(applicationRepository).findByOpportunityElderIdAndStatusInOrderBySubmittedAtDesc(
                org.mockito.ArgumentMatchers.eq(elder.getId()), statuses.capture());
        assertThat(Set.copyOf(statuses.getValue())).doesNotContain(OpportunityApplicationStatus.SAVED);
        assertThat(Set.copyOf(statuses.getValue())).contains(OpportunityApplicationStatus.PENDING);
    }
}
