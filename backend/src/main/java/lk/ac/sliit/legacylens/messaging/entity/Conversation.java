package lk.ac.sliit.legacylens.messaging.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.users.entity.User;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One private chat thread between an elder and a content creator — the
 * shared in-app messaging used by BOTH sides of the app (creator InApp /
 * InboxMessage screens and the elder hiring flow via MessagingChannelPort).
 *
 * Exactly one conversation per (elder, creator) pair, like any messaging app:
 * talking about a second opportunity continues the same thread, and
 * {@link #opportunity} simply points at the most recent thing they're
 * working on together (shown as the context card at the top of the chat).
 *
 * The last-message fields are denormalised so the inbox list never has to
 * scan messages; each side's lastReadAt drives its unread count.
 */
@Entity
@Table(name = "conversations",
        uniqueConstraints = @UniqueConstraint(columnNames = { "elder_id", "creator_id" }))
@Getter
@Setter
@NoArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elder_id", nullable = false)
    private User elder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    /** What the two are currently working on together, if anything — drives the chat's context card. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opportunity_id")
    private Opportunity opportunity;

    /** First ~120 characters of the latest message ("Voice message" for a voice note). */
    @Column(name = "last_message_preview", length = 200)
    private String lastMessagePreview;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_message_type", length = 20)
    private MessageType lastMessageType;

    @Column(name = "last_message_sender_id", columnDefinition = "uuid")
    private UUID lastMessageSenderId;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    /** When the elder last opened this chat — messages from the creator after this are unread for them. */
    @Column(name = "elder_last_read_at")
    private LocalDateTime elderLastReadAt;

    /** When the creator last opened this chat — messages from the elder after this are unread for them. */
    @Column(name = "creator_last_read_at")
    private LocalDateTime creatorLastReadAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public boolean hasParticipant(UUID userId) {
        return elder.getId().equals(userId) || creator.getId().equals(userId);
    }

    public boolean isElder(UUID userId) {
        return elder.getId().equals(userId);
    }

    /** The other person in the chat, from {@code userId}'s point of view. */
    public User otherParticipant(UUID userId) {
        return isElder(userId) ? creator : elder;
    }

    /** The participant who is {@code userId} - the elder or the creator. */
    public User participant(UUID userId) {
        return isElder(userId) ? elder : creator;
    }

    /** {@code userId} has seen everything in this chat up to {@code at}. */
    public void markReadBy(UUID userId, LocalDateTime at) {
        if (isElder(userId)) {
            elderLastReadAt = at;
        } else {
            creatorLastReadAt = at;
        }
    }

    /** Keeps the inbox row in step with a newly sent message; the sender has, of course, read it. */
    public void recordMessage(MessageType type, String preview, UUID senderId, LocalDateTime at) {
        lastMessageType = type;
        lastMessagePreview = preview;
        lastMessageSenderId = senderId;
        lastMessageAt = at;
        markReadBy(senderId, at);
    }
}
