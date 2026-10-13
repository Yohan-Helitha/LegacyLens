package lk.ac.sliit.legacylens.messaging.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Start (or reopen) the chat about an opportunity. A creator only names the
 * opportunity — the other person is its elder. An elder must also say which
 * creator ({@code participantId}).
 */
@Data
public class OpenConversationRequest {

    @NotNull(message = "opportunityId is required")
    private UUID opportunityId;

    private UUID participantId;
}
