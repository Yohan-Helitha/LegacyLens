package lk.ac.sliit.legacylens.messaging.service;

import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.messaging.dto.ConversationContextResponse;
import lk.ac.sliit.legacylens.messaging.dto.ConversationDetailResponse;
import lk.ac.sliit.legacylens.messaging.dto.ConversationSummaryResponse;
import lk.ac.sliit.legacylens.messaging.dto.MessageResponse;
import lk.ac.sliit.legacylens.messaging.entity.Conversation;
import lk.ac.sliit.legacylens.messaging.mapper.ConversationMapper;
import lk.ac.sliit.legacylens.messaging.entity.Message;
import lk.ac.sliit.legacylens.messaging.entity.MessageType;
import lk.ac.sliit.legacylens.messaging.repository.ConversationRepository;
import lk.ac.sliit.legacylens.messaging.repository.MessageRepository;
import lk.ac.sliit.legacylens.users.entity.User;
import lk.ac.sliit.legacylens.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessagingServiceImplTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private UserRepository userRepository;
    @Mock private OpportunityAccess opportunityAccess;
    @Mock private ConversationContextProvider contextProvider;

    private MessagingServiceImpl service;

    private User elder;
    private User creator;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        service = new MessagingServiceImpl(conversationRepository, messageRepository, userRepository,
                opportunityAccess, new ConversationMapper(contextProvider));

        elder = user("Kamala Wijesinghe");
        creator = user("Nimal Perera");
        conversation = new Conversation();
        conversation.setId(UUID.randomUUID());
        conversation.setElder(elder);
        conversation.setCreator(creator);
        conversation.setCreatedAt(LocalDateTime.now().minusDays(1));
    }

    private static User user(String name) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName(name);
        user.setPhoneNumber("+94771234567");
        return user;
    }

    private Opportunity opportunity() {
        Opportunity opportunity = new Opportunity();
        opportunity.setId(UUID.randomUUID());
        opportunity.setElder(elder);
        opportunity.setTitle("Traditional recipe documentation");
        opportunity.setCategory("Food");
        opportunity.setLocation("Negombo");
        opportunity.setScheduledDate(LocalDate.of(2026, 8, 20));
        return opportunity;
    }

    // ── Access ──────────────────────────────────────────────────────────────

    @Test
    void someoneOutsideTheConversation_getsNotFound() {
        when(conversationRepository.findById(conversation.getId())).thenReturn(Optional.of(conversation));

        assertThrows(ResourceNotFoundException.class,
                () -> service.getConversation(UUID.randomUUID(), conversation.getId()));
        assertThrows(ResourceNotFoundException.class,
                () -> service.sendText(UUID.randomUUID(), conversation.getId(), "Hi"));
    }

    @Test
    void eachSide_seesTheOtherPerson() {
        when(conversationRepository.findById(conversation.getId())).thenReturn(Optional.of(conversation));

        ConversationDetailResponse asCreator = service.getConversation(creator.getId(), conversation.getId());
        ConversationDetailResponse asElder = service.getConversation(elder.getId(), conversation.getId());

        assertThat(asCreator.getMyRole()).isEqualTo("CREATOR");
        assertThat(asCreator.getOtherParticipant().getName()).isEqualTo("Kamala Wijesinghe");
        assertThat(asCreator.getOtherParticipant().getRoleLabel()).isEqualTo("Knowledge Holder");
        assertThat(asElder.getMyRole()).isEqualTo("ELDER");
        assertThat(asElder.getOtherParticipant().getName()).isEqualTo("Nimal Perera");
    }

    @Test
    void phoneNumber_isOnlyInTheSingleConversationResponse() {
        when(conversationRepository.findById(conversation.getId())).thenReturn(Optional.of(conversation));
        when(conversationRepository.findAllForUser(creator.getId())).thenReturn(List.of(conversation));

        assertThat(service.getConversation(creator.getId(), conversation.getId())
                .getOtherParticipant().getPhoneNumber()).isEqualTo("+94771234567");
        assertThat(service.listConversations(creator.getId(), ConversationFilter.ALL, null))
                .allSatisfy(row -> assertThat(row.getOtherParticipant().getPhoneNumber()).isNull());
    }

    // ── Sending ─────────────────────────────────────────────────────────────

    @Test
    void sendText_storesTheMessageAndUpdatesTheInboxRow() {
        LocalDateTime sentAt = LocalDateTime.now();
        when(conversationRepository.findById(conversation.getId())).thenReturn(Optional.of(conversation));
        when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(sentAt);
            return message;
        });

        MessageResponse response = service.sendText(creator.getId(), conversation.getId(), "  See you on Saturday  ");

        assertThat(response.isFromMe()).isTrue();
        assertThat(response.getBody()).isEqualTo("See you on Saturday");
        assertThat(response.getType()).isEqualTo(MessageType.TEXT);
        assertThat(conversation.getLastMessagePreview()).isEqualTo("See you on Saturday");
        assertThat(conversation.getLastMessageSenderId()).isEqualTo(creator.getId());
        assertThat(conversation.getLastMessageAt()).isEqualTo(sentAt);
        // Your own message is never unread for you — but stays unread for the elder.
        assertThat(conversation.getCreatorLastReadAt()).isEqualTo(sentAt);
        assertThat(conversation.getElderLastReadAt()).isNull();
    }

    @Test
    void sendText_blank_isRejected() {
        assertThrows(InvalidRequestException.class, () -> service.sendText(creator.getId(), conversation.getId(), "   "));
        verify(messageRepository, never()).saveAndFlush(any());
    }

    @Test
    void sendVoiceNote_showsAsVoiceMessageInTheInbox() {
        when(conversationRepository.findById(conversation.getId())).thenReturn(Optional.of(conversation));
        when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            message.setCreatedAt(LocalDateTime.now());
            return message;
        });

        MessageResponse response = service.sendVoiceNote(elder.getId(), conversation.getId(), "/uploads/voice-replies/a.m4a");

        assertThat(response.getMediaUrl()).isEqualTo("/uploads/voice-replies/a.m4a");
        assertThat(conversation.getLastMessagePreview()).isEqualTo("Voice message");
        assertThat(conversation.getElderLastReadAt()).isNotNull();
    }

    @Test
    void longMessages_arePreviewedOnOneShortLine() {
        String preview = MessagePreview.truncate("Line one\n\n" + "x".repeat(300));

        assertThat(preview).doesNotContain("\n").endsWith("…");
        assertThat(preview).hasSize(MessagePreview.LENGTH);
    }

    @Test
    void markRead_onlyTouchesTheCallersSide() {
        when(conversationRepository.findById(conversation.getId())).thenReturn(Optional.of(conversation));

        service.markRead(elder.getId(), conversation.getId());

        assertThat(conversation.getElderLastReadAt()).isNotNull();
        assertThat(conversation.getCreatorLastReadAt()).isNull();
    }

    // ── Inbox ───────────────────────────────────────────────────────────────

    @Test
    void listConversations_filtersAndSearches() {
        Conversation unreadAboutRecipe = conversation;
        unreadAboutRecipe.setOpportunity(opportunity());
        unreadAboutRecipe.setLastMessagePreview("Can you come next week?");

        Conversation readNoContext = new Conversation();
        readNoContext.setId(UUID.randomUUID());
        readNoContext.setElder(user("Sunil Perera"));
        readNoContext.setCreator(creator);
        readNoContext.setLastMessagePreview("Thank you");

        when(conversationRepository.findAllForUser(creator.getId())).thenReturn(List.of(unreadAboutRecipe, readNoContext));
        List<Object[]> unreadRows = new ArrayList<>();
        unreadRows.add(new Object[] { unreadAboutRecipe.getId(), 2L });
        when(messageRepository.countUnreadByConversation(anyCollection(), eq(creator.getId()), any())).thenReturn(unreadRows);
        when(contextProvider.contextsFor(anyCollection())).thenAnswer(invocation -> {
            Collection<Conversation> asked = invocation.getArgument(0);
            return asked.contains(unreadAboutRecipe)
                    ? Map.of(unreadAboutRecipe.getId(), ConversationContextResponse.builder().title("Traditional recipe documentation").build())
                    : Map.of();
        });

        List<ConversationSummaryResponse> all = service.listConversations(creator.getId(), ConversationFilter.ALL, null);
        List<ConversationSummaryResponse> unread = service.listConversations(creator.getId(), ConversationFilter.UNREAD, null);
        List<ConversationSummaryResponse> collaborations = service.listConversations(creator.getId(), ConversationFilter.COLLABORATIONS, null);
        List<ConversationSummaryResponse> searched = service.listConversations(creator.getId(), ConversationFilter.ALL, "sunil");
        List<ConversationSummaryResponse> searchedByContext = service.listConversations(creator.getId(), ConversationFilter.ALL, "recipe");

        assertThat(all).hasSize(2);
        assertThat(all.get(0).getUnreadCount()).isEqualTo(2);
        assertThat(all.get(1).getUnreadCount()).isZero();
        assertThat(unread).extracting(ConversationSummaryResponse::getId).containsExactly(unreadAboutRecipe.getId());
        assertThat(collaborations).extracting(ConversationSummaryResponse::getId).containsExactly(unreadAboutRecipe.getId());
        assertThat(searched).extracting(ConversationSummaryResponse::getId).containsExactly(readNoContext.getId());
        assertThat(searchedByContext).extracting(ConversationSummaryResponse::getId).containsExactly(unreadAboutRecipe.getId());
    }

    @Test
    void listConversations_fetchesTheContextCardsOnceAndOnlyForTheRowsShown() {
        Conversation about = conversation;
        about.setOpportunity(opportunity());
        Conversation other = new Conversation();
        other.setId(UUID.randomUUID());
        other.setElder(user("Sunil Perera"));
        other.setCreator(creator);
        other.setOpportunity(opportunity());

        when(conversationRepository.findAllForUser(creator.getId())).thenReturn(List.of(about, other));
        when(messageRepository.countUnreadByConversation(anyCollection(), eq(creator.getId()), any())).thenReturn(List.of());
        when(contextProvider.contextsFor(anyCollection())).thenReturn(Map.of());

        service.listConversations(creator.getId(), ConversationFilter.ALL, "sunil");

        // Only Sunil's row survives the search, and its card is requested in a single call.
        org.mockito.ArgumentCaptor<Collection<Conversation>> asked = org.mockito.ArgumentCaptor.forClass(Collection.class);
        verify(contextProvider, org.mockito.Mockito.times(1)).contextsFor(asked.capture());
        assertThat(asked.getValue()).containsExactly(other);
        verify(contextProvider, never()).contextFor(any());
    }

    // ── Opening ─────────────────────────────────────────────────────────────

    @Test
    void openConversation_reusesTheExistingThreadForThePair() {
        when(conversationRepository.findByElderIdAndCreatorId(elder.getId(), creator.getId())).thenReturn(Optional.of(conversation));
        when(conversationRepository.save(conversation)).thenReturn(conversation);

        UUID id = service.openConversation(elder.getId(), creator.getId(), null);

        assertThat(id).isEqualTo(conversation.getId());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void openConversation_withYourself_isRejected() {
        assertThrows(InvalidRequestException.class,
                () -> service.openConversation(elder.getId(), elder.getId(), null));
    }

    @Test
    void openForOpportunity_creatorWithNoConnection_isForbidden() {
        Opportunity opportunity = opportunity();
        when(opportunityAccess.findOpportunity(opportunity.getId())).thenReturn(Optional.of(opportunity));
        when(opportunityAccess.isCreatorConnected(opportunity.getId(), creator.getId())).thenReturn(false);

        assertThrows(ForbiddenOperationException.class,
                () -> service.openForOpportunity(creator.getId(), opportunity.getId(), null));
    }

    @Test
    void openForOpportunity_elderMustSayWhichCreator() {
        Opportunity opportunity = opportunity();
        when(opportunityAccess.findOpportunity(opportunity.getId())).thenReturn(Optional.of(opportunity));

        assertThrows(InvalidRequestException.class,
                () -> service.openForOpportunity(elder.getId(), opportunity.getId(), null));
    }
}
