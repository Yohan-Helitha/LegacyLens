package lk.ac.sliit.legacylens.messaging.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/** The other person in a conversation, as shown in the inbox row and chat header. */
@Data
@Builder
@AllArgsConstructor
public class ParticipantResponse {

    private UUID userId;
    private String name;
    private String avatarUrl;

    /** ELDER or CREATOR — their side of this conversation. */
    private String role;

    /** Human label for the header, e.g. "Knowledge Holder" / "Content Creator". */
    private String roleLabel;

    /**
     * Their phone number, so the app can open the normal phone dialer. Only filled in
     * on the single-conversation response (never the inbox list), and only ever shown
     * to the other member of that conversation.
     */
    private String phoneNumber;
}
