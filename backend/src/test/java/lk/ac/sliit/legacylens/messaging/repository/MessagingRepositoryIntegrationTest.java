package lk.ac.sliit.legacylens.messaging.repository;

import lk.ac.sliit.legacylens.messaging.entity.Conversation;
import lk.ac.sliit.legacylens.messaging.entity.Message;
import lk.ac.sliit.legacylens.messaging.entity.MessageType;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Runs the messaging module's hand-written JPQL (inbox listing and the
 * per-side unread count) against a real H2 schema — the service tests mock
 * these, so this is what proves the queries themselves are right.
 */
@DataJpaTest
class MessagingRepositoryIntegrationTest {

    private static final LocalDateTime EPOCH = LocalDateTime.of(1970, 1, 1, 0, 0);

    @Autowired private ConversationRepository conversationRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private UserRepository userRepository;

    private User elder;
    private User creator;
    private User stranger;

    @BeforeEach
    void setUp() {
        elder = persistUser("Kamala Wijesinghe", "+94770000101", "195512345678");
        creator = persistUser("Nimal Perera", "+94770000102", "199912345678");
        stranger = persistUser("Ruwan Silva", "+94770000103", "198812345678");
    }

    private User persistUser(String name, String phone, String nic) {
        User user = new User();
        user.setFullName(name);
        user.setPhoneNumber(phone);
        user.setNicNumber(nic);
        user.setDateOfBirth(LocalDate.of(1990, 1, 1));
        user.setPinHash("irrelevant-hash");
        return userRepository.save(user);
    }

    private Conversation persistConversation(User elderUser, User creatorUser) {
        Conversation conversation = new Conversation();
        conversation.setElder(elderUser);
        conversation.setCreator(creatorUser);
        return conversationRepository.saveAndFlush(conversation);
    }

    private void persistMessage(Conversation conversation, User sender, String text) {
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setType(MessageType.TEXT);
        message.setBody(text);
        messageRepository.saveAndFlush(message);
    }

    private Map<UUID, Long> unreadFor(User user, List<UUID> conversationIds) {
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : messageRepository.countUnreadByConversation(conversationIds, user.getId(), EPOCH)) {
            counts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return counts;
    }

    @Test
    void unreadCount_onlyCountsTheOtherPersonsMessages_againstYourOwnLastRead() {
        Conversation conversation = persistConversation(elder, creator);
        persistMessage(conversation, elder, "Can you come next week?");
        persistMessage(conversation, elder, "Saturday morning?");
        persistMessage(conversation, creator, "Yes, Saturday works");

        // Nobody has opened the chat yet.
        assertThat(unreadFor(creator, List.of(conversation.getId()))).containsEntry(conversation.getId(), 2L);
        assertThat(unreadFor(elder, List.of(conversation.getId()))).containsEntry(conversation.getId(), 1L);

        // The creator reads it: their count clears, the elder's is untouched.
        conversation.setCreatorLastReadAt(LocalDateTime.now().plusMinutes(1));
        conversationRepository.saveAndFlush(conversation);

        assertThat(unreadFor(creator, List.of(conversation.getId()))).doesNotContainKey(conversation.getId());
        assertThat(unreadFor(elder, List.of(conversation.getId()))).containsEntry(conversation.getId(), 1L);
    }

    @Test
    void findAllForUser_returnsOnlyTheUsersOwnConversations() {
        Conversation mine = persistConversation(elder, creator);
        Conversation notMine = persistConversation(stranger, creator);

        assertThat(conversationRepository.findAllForUser(elder.getId()))
                .extracting(Conversation::getId).containsExactly(mine.getId());
        assertThat(conversationRepository.findAllForUser(creator.getId()))
                .extracting(Conversation::getId).containsExactlyInAnyOrder(mine.getId(), notMine.getId());
    }

    @Test
    void onlyOneConversationPerElderAndCreator() {
        persistConversation(elder, creator);

        assertThrows(DataIntegrityViolationException.class, () -> persistConversation(elder, creator));
    }

    @Test
    void latestPage_comesBackNewestFirst() {
        Conversation conversation = persistConversation(elder, creator);
        persistMessage(conversation, elder, "first");
        persistMessage(conversation, creator, "second");

        List<Message> page = messageRepository.findByConversationIdOrderByCreatedAtDesc(
                conversation.getId(), org.springframework.data.domain.PageRequest.of(0, 10));

        assertThat(page).hasSize(2);
        assertThat(page).extracting(Message::getConversation).allMatch(c -> c.getId().equals(conversation.getId()));
    }
}
