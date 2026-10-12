package lk.ac.sliit.legacylens.hiring.service;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ReplyServiceImpl implements ReplyService {

    private final MessagingChannelPort messagingChannelPort;

    public ReplyServiceImpl(MessagingChannelPort messagingChannelPort) {
        this.messagingChannelPort = messagingChannelPort;
    }

    @Override
    public void replyWithVoice(UUID conversationId, UUID userId, String mediaUrl) {
        MessageContent content = new MessageContent(MessageContentType.VOICE_NOTE, mediaUrl);
        messagingChannelPort.sendMessage(conversationId, content);
    }
}
