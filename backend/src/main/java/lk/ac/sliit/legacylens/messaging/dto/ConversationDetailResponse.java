package lk.ac.sliit.legacylens.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/** Header + context card for one chat (InboxMessage screen). Messages are fetched separately. */
@Data
@Builder
@AllArgsConstructor
public class ConversationDetailResponse {

    private UUID id;

    /** ELDER or CREATOR — the caller's own side of this conversation. */
    private String myRole;

    private ParticipantResponse otherParticipant;

    /** Null when the conversation isn't tied to an opportunity. */
    private ConversationContextResponse context;
}
