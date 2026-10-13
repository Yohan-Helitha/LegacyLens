package lk.ac.sliit.legacylens.messaging.service;

import lk.ac.sliit.legacylens.messaging.dto.ConversationContextResponse;
import lk.ac.sliit.legacylens.messaging.entity.Conversation;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Builds the "what they are working on" card shown at the top of a chat; null when there is none. */
public interface ConversationContextProvider {

    ConversationContextResponse contextFor(Conversation conversation);

    /**
     * The cards for a whole inbox at once, by conversation id; a conversation with no card is left out.
     * Providers that can fetch in bulk should override this - the default asks one conversation at a time.
     */
    default Map<UUID, ConversationContextResponse> contextsFor(Collection<Conversation> conversations) {
        Map<UUID, ConversationContextResponse> contexts = new HashMap<>();
        for (Conversation conversation : conversations) {
            ConversationContextResponse context = contextFor(conversation);
            if (context != null) {
                contexts.put(conversation.getId(), context);
            }
        }
        return contexts;
    }
}
