package lk.ac.sliit.legacylens.messaging.service;

import lk.ac.sliit.legacylens.common.exception.ForbiddenOperationException;
import lk.ac.sliit.legacylens.common.exception.InvalidRequestException;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class MessagingServiceImpl implements MessagingService {

    static final int DEFAULT_PAGE_SIZE = 50;
    static final int MAX_PAGE_SIZE = 100;

    /** Stand-in for "never read" in the unread-count query. */
    private static final LocalDateTime EPOCH = LocalDateTime.of(1970, 1, 1, 0, 0);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final OpportunityAccess opportunityAccess;
    private final ConversationMapper mapper;

    public MessagingServiceImpl(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            UserRepository userRepository,
            OpportunityAccess opportunityAccess,
            ConversationMapper mapper) {

        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.opportunityAccess = opportunityAccess;
        this.mapper = mapper;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Reading
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ConversationSummaryResponse> listConversations(UUID userId, ConversationFilter filter, String search) {
        List<Conversation> conversations = conversationRepository.findAllForUser(userId);
        if (conversations.isEmpty()) {
            return List.of();
        }

        Map<UUID, Long> unread = new HashMap<>();
        for (Object[] row : messageRepository.countUnreadByConversation(
                conversations.stream().map(Conversation::getId).toList(), userId, EPOCH)) {
            unread.put((UUID) row[0], ((Number) row[1]).longValue());
        }

        String query = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        ConversationFilter effectiveFilter = filter == null ? ConversationFilter.ALL : filter;

        List<ConversationSummaryResponse> result = new ArrayList<>();
        for (Conversation conversation : conversations) {
            long unreadCount = unread.getOrDefault(conversation.getId(), 0L);
            if (effectiveFilter == ConversationFilter.UNREAD && unreadCount == 0) continue;
            if (effectiveFilter == ConversationFilter.COLLABORATIONS && conversation.getOpportunity() == null) continue;

            ConversationSummaryResponse summary = mapper.toSummary(conversation, userId, unreadCount);
            if (!query.isEmpty() && !matches(summary, query)) continue;
            result.add(summary);
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationDetailResponse getConversation(UUID userId, UUID conversationId) {
        return mapper.toDetail(loadForParticipant(userId, conversationId), userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID userId, UUID conversationId, LocalDateTime before,
                                             LocalDateTime after, int limit) {
        Conversation conversation = loadForParticipant(userId, conversationId);
        int size = limit <= 0 ? DEFAULT_PAGE_SIZE : Math.min(limit, MAX_PAGE_SIZE);

        if (after != null) {
            return messageRepository.findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(conversation.getId(), after)
                    .stream().map(message -> mapper.toMessage(message, userId)).toList();
        }

        List<Message> newestFirst = before != null
                ? messageRepository.findByConversationIdAndCreatedAtBeforeOrderByCreatedAtDesc(
                        conversation.getId(), before, PageRequest.of(0, size))
                : messageRepository.findByConversationIdOrderByCreatedAtDesc(conversation.getId(), PageRequest.of(0, size));

        List<Message> readingOrder = new ArrayList<>(newestFirst);
        Collections.reverse(readingOrder);
        return readingOrder.stream().map(message -> mapper.toMessage(message, userId)).toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Writing
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public MessageResponse sendText(UUID userId, UUID conversationId, String text) {
        if (text == null || text.isBlank()) {
            throw new InvalidRequestException("Message cannot be empty");
        }
        Conversation conversation = loadForParticipant(userId, conversationId);
        return mapper.toMessage(store(conversation, userId, MessageType.TEXT, text.trim(), null), userId);
    }

    @Override
    @Transactional
    public MessageResponse sendVoiceNote(UUID userId, UUID conversationId, String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            throw new InvalidRequestException("A voice note needs a recording");
        }
        Conversation conversation = loadForParticipant(userId, conversationId);
        return mapper.toMessage(store(conversation, userId, MessageType.VOICE_NOTE, null, mediaUrl), userId);
    }

    @Override
    @Transactional
    public void markRead(UUID userId, UUID conversationId) {
        Conversation conversation = loadForParticipant(userId, conversationId);
        conversation.markReadBy(userId, LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    @Override
    @Transactional
    public ConversationDetailResponse openForOpportunity(UUID userId, UUID opportunityId, UUID participantId) {
        Opportunity opportunity = opportunityAccess.findOpportunity(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
        User elder = opportunity.getElder();
        if (elder == null) {
            throw new InvalidRequestException("This opportunity isn't linked to an elder yet.");
        }

        UUID creatorId;
        if (elder.getId().equals(userId)) {
            if (participantId == null) {
                throw new InvalidRequestException("Choose which creator to message.");
            }
            creatorId = participantId;
        } else {
            creatorId = userId;
        }

        if (!opportunityAccess.isCreatorConnected(opportunityId, creatorId)) {
            throw new ForbiddenOperationException("You can only message people you are working with on this opportunity.");
        }

        UUID conversationId = openConversation(elder.getId(), creatorId, opportunityId);
        return getConversation(userId, conversationId);
    }

    @Override
    @Transactional
    public UUID openConversation(UUID elderId, UUID creatorId, UUID opportunityId) {
        if (elderId.equals(creatorId)) {
            throw new InvalidRequestException("A conversation needs two different people.");
        }

        Conversation conversation = conversationRepository.findByElderIdAndCreatorId(elderId, creatorId)
                .orElseGet(() -> {
                    Conversation created = new Conversation();
                    created.setElder(userRepository.findById(elderId)
                            .orElseThrow(() -> new ResourceNotFoundException("Elder not found")));
                    created.setCreator(userRepository.findById(creatorId)
                            .orElseThrow(() -> new ResourceNotFoundException("Creator not found")));
                    return created;
                });

        // The chat's context card follows what they are working on most recently.
        if (opportunityId != null) {
            opportunityAccess.findOpportunity(opportunityId).ifPresent(conversation::setOpportunity);
        }

        return conversationRepository.save(conversation).getId();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** The conversation, but only if {@code userId} is in it — anyone else gets "not found". */
    private Conversation loadForParticipant(UUID userId, UUID conversationId) {
        return conversationRepository.findById(conversationId)
                .filter(conversation -> conversation.hasParticipant(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    }

    private Message store(Conversation conversation, UUID senderId, MessageType type, String body, String mediaUrl) {
        User sender = conversation.participant(senderId);

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setType(type);
        message.setBody(body);
        message.setMediaUrl(mediaUrl);
        // Flushed so createdAt is populated before it's copied onto the conversation.
        Message saved = messageRepository.saveAndFlush(message);

        conversation.recordMessage(type, MessagePreview.of(type, body), senderId, saved.getCreatedAt());
        conversationRepository.save(conversation);

        return saved;
    }

    private static boolean matches(ConversationSummaryResponse summary, String query) {
        return contains(summary.getOtherParticipant().getName(), query)
                || contains(summary.getLastMessagePreview(), query)
                || (summary.getContext() != null && contains(summary.getContext().getTitle(), query));
    }

    private static boolean contains(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }
}
