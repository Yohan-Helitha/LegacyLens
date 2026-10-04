package lk.ac.sliit.legacylens.messaging.service;

import lk.ac.sliit.legacylens.messaging.dto.ConversationContextResponse;
import lk.ac.sliit.legacylens.messaging.entity.Conversation;

/** Builds the "what they are working on" card shown at the top of a chat; null when there is none. */
public interface ConversationContextProvider {

    ConversationContextResponse contextFor(Conversation conversation);
}
