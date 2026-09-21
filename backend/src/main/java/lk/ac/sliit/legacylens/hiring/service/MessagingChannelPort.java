package lk.ac.sliit.legacylens.hiring.service;

import java.util.UUID;

/**
 * The boundary between this (elder-side hiring) module and the Marketplace
 * module, which owns real conversation/message storage — this module
 * depends only on this interface, never a concrete Marketplace class
 * (Dependency Inversion). Agree on this contract with the Marketplace team
 * before either side changes it; MessagingChannelPortContractTest is the
 * test their real implementation must also pass.
 */
public interface MessagingChannelPort {

    /** Opens (or returns an existing) conversation between an elder and a creator, returning its id. */
    UUID openConversation(UUID elderId, UUID creatorId);

    void sendMessage(UUID conversationId, MessageContent content);
}
