package lk.ac.sliit.legacylens.marketplace.event;

import lk.ac.sliit.legacylens.notifications.service.PushMessage;
import lk.ac.sliit.legacylens.notifications.service.PushNotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OpportunityPublishedNotifierTest {

    @Mock private PushNotificationService pushNotificationService;

    private final UUID elderId = UUID.randomUUID();
    private final UUID opportunityId = UUID.randomUUID();
    private final OpportunityPublishedEvent event =
            new OpportunityPublishedEvent(elderId, opportunityId, "Traditional recipe documentation");

    @Test
    void thePublishedOpportunity_isReportedToItsKnowledgeHolder_underAPublishedHeader() {
        new OpportunityPublishedNotifier(pushNotificationService).onPublished(event);

        ArgumentCaptor<PushMessage> sent = ArgumentCaptor.forClass(PushMessage.class);
        verify(pushNotificationService).sendToUser(eq(elderId), sent.capture());
        assertThat(sent.getValue().title()).isEqualTo("Published");
        assertThat(sent.getValue().body()).contains("Traditional recipe documentation").contains("published");
        assertThat(sent.getValue().data()).containsEntry("type", "opportunity-published")
                .containsEntry("opportunityId", opportunityId.toString());
    }

    @Test
    void aFailureToSend_isSwallowed_soThePublishAlwaysStands() {
        doThrow(new RuntimeException("push down")).when(pushNotificationService).sendToUser(any(), any());

        assertThatCode(() -> new OpportunityPublishedNotifier(pushNotificationService).onPublished(event))
                .doesNotThrowAnyException();
    }
}
