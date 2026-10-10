package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.marketplace.entity.OpportunityApplicationStatus;
import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ApplicationDecisionNotifierTest {

    @Mock private PushNotificationService pushNotificationService;

    private final UUID creatorId = UUID.randomUUID();
    private final UUID applicationId = UUID.randomUUID();

    private ApplicationDecidedEvent decision(OpportunityApplicationStatus status) {
        return new ApplicationDecidedEvent(creatorId, applicationId, "Traditional recipe documentation", status);
    }

    @Test
    void aRejection_isSentToTheCreator_withAnApplicationRejectedType() {
        new ApplicationDecisionNotifier(pushNotificationService).onDecision(decision(OpportunityApplicationStatus.REJECTED));

        ArgumentCaptor<PushMessage> sent = ArgumentCaptor.forClass(PushMessage.class);
        verify(pushNotificationService).sendToUser(eq(creatorId), sent.capture());
        assertThat(sent.getValue().title()).isEqualTo("Application update");
        assertThat(sent.getValue().body()).contains("Traditional recipe documentation").contains("not accepted");
        assertThat(sent.getValue().data()).containsEntry("type", "application-rejected")
                .containsEntry("applicationId", applicationId.toString());
    }

    @Test
    void anApproval_isSentToTheCreator_asGoodNews() {
        new ApplicationDecisionNotifier(pushNotificationService).onDecision(decision(OpportunityApplicationStatus.APPROVED));

        ArgumentCaptor<PushMessage> sent = ArgumentCaptor.forClass(PushMessage.class);
        verify(pushNotificationService).sendToUser(eq(creatorId), sent.capture());
        assertThat(sent.getValue().data()).containsEntry("type", "application-approved");
        assertThat(sent.getValue().body()).contains("accepted");
    }

    @Test
    void otherStatuses_sendNothing() {
        new ApplicationDecisionNotifier(pushNotificationService).onDecision(decision(OpportunityApplicationStatus.PENDING));

        verify(pushNotificationService, never()).sendToUser(any(), any());
    }

    @Test
    void aFailureWhileSending_isSwallowed_soItNeverReachesTheDecision() {
        doThrow(new IllegalStateException("push service down"))
                .when(pushNotificationService).sendToUser(eq(creatorId), any());

        new ApplicationDecisionNotifier(pushNotificationService).onDecision(decision(OpportunityApplicationStatus.REJECTED));

        verify(pushNotificationService).sendToUser(eq(creatorId), any());
    }
}
