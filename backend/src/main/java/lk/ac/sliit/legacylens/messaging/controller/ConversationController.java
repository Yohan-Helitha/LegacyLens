package lk.ac.sliit.legacylens.messaging.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.messaging.dto.ConversationDetailResponse;
import lk.ac.sliit.legacylens.messaging.dto.ConversationSummaryResponse;
import lk.ac.sliit.legacylens.messaging.dto.MessageResponse;
import lk.ac.sliit.legacylens.messaging.dto.OpenConversationRequest;
import lk.ac.sliit.legacylens.messaging.dto.SendMessageRequest;
import lk.ac.sliit.legacylens.messaging.service.ConversationFilter;
import lk.ac.sliit.legacylens.messaging.service.MessagingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Shared in-app messaging — the same endpoints serve elders and content
 * creators; the caller's side of each conversation is worked out from who
 * they are. Requires a valid Bearer token. Voice notes are sent through
 * POST /api/conversations/{id}/reply-voice (hiring's ReplyController), which
 * stores them here via MessagingChannelPort.
 */
@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final MessagingService messagingService;

    public ConversationController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    /** The inbox: every conversation the caller is in, most recently active first. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationSummaryResponse>>> list(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(defaultValue = "ALL") ConversationFilter filter,
            @RequestParam(required = false) String search) {

        return ResponseEntity.ok(ApiResponse.ok(
                messagingService.listConversations(principal.getUser().getId(), filter, search)));
    }

    /** Start (or reopen) the chat about an opportunity the two are connected through. */
    @PostMapping
    public ResponseEntity<ApiResponse<ConversationDetailResponse>> open(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody OpenConversationRequest request) {

        return ResponseEntity.ok(ApiResponse.ok(messagingService.openForOpportunity(
                principal.getUser().getId(), request.getOpportunityId(), request.getParticipantId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationDetailResponse>> get(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id) {

        return ResponseEntity.ok(ApiResponse.ok(messagingService.getConversation(principal.getUser().getId(), id)));
    }

    /** Latest page by default; {@code after} for polling new messages, {@code before} for older history. */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> messages(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime after,
            @RequestParam(defaultValue = "50") int limit) {

        return ResponseEntity.ok(ApiResponse.ok(
                messagingService.getMessages(principal.getUser().getId(), id, before, after, limit)));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> send(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest request) {

        return ResponseEntity.ok(ApiResponse.ok(
                messagingService.sendText(principal.getUser().getId(), id, request.getText())));
    }

    /** Clears the caller's unread count for this chat. */
    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable UUID id) {

        messagingService.markRead(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", null));
    }
}
