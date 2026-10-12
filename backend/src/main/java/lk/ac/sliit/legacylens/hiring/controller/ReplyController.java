package lk.ac.sliit.legacylens.hiring.controller;

import lk.ac.sliit.legacylens.auth.security.CustomUserDetails;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.common.storage.FileStorageService;
import lk.ac.sliit.legacylens.hiring.service.ReplyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Thin adapter: stores the uploaded voice clip, then delegates to
 * ReplyService with the resulting URL. The actual conversation storage
 * lives in the Marketplace module — this endpoint doesn't verify the caller
 * belongs to `id`'s conversation, since that data isn't reachable from here.
 */
@RestController
@RequestMapping("/api/conversations")
public class ReplyController {

    private static final String VOICE_REPLY_SUBFOLDER = "voice-replies";

    private final ReplyService replyService;
    private final FileStorageService fileStorageService;

    public ReplyController(ReplyService replyService, FileStorageService fileStorageService) {
        this.replyService = replyService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = "/{id}/reply-voice", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Void>> replyWithVoice(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("id") UUID conversationId,
            @RequestParam("media") MultipartFile media) {

        String relativePath = fileStorageService.store(media, VOICE_REPLY_SUBFOLDER);
        String mediaUrl = "/uploads/" + relativePath;

        replyService.replyWithVoice(conversationId, principal.getUser().getId(), mediaUrl);

        return ResponseEntity.ok(ApiResponse.ok("Reply sent", null));
    }
}
