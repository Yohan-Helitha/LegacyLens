package lk.ac.sliit.legacylens.moderation.controller;

import lk.ac.sliit.legacylens.moderation.dto.StoryQuizDTO;
import lk.ac.sliit.legacylens.moderation.service.StoryQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class StoryQuizController {

    private final StoryQuizService quizService;

    @GetMapping("/api/v1/moderation/stories/{storyId}/quiz")
    public ResponseEntity<StoryQuizDTO> getModerationQuiz(@PathVariable UUID storyId) {
        StoryQuizDTO quiz = quizService.getQuizByStoryId(storyId);
        return ResponseEntity.ok(quiz);
    }

    @PostMapping("/api/v1/moderation/stories/{storyId}/quiz")
    public ResponseEntity<StoryQuizDTO> saveModerationQuiz(
            @PathVariable UUID storyId,
            @RequestBody StoryQuizDTO dto) {
        StoryQuizDTO saved = quizService.saveOrUpdateQuiz(storyId, dto);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/api/v1/moderation/stories/{storyId}/quiz/ai-generate")
    public ResponseEntity<StoryQuizDTO> generateAiQuiz(
            @PathVariable UUID storyId,
            @RequestBody(required = false) lk.ac.sliit.legacylens.moderation.dto.AiGenerateQuizRequest request) {
        StoryQuizDTO generated = quizService.generateAiQuiz(storyId, request);
        return ResponseEntity.ok(generated);
    }

    @GetMapping("/api/v1/home/feed/{storyId}/quiz")
    public ResponseEntity<StoryQuizDTO> getFeedItemQuiz(@PathVariable String storyId) {
        try {
            UUID uuid = UUID.fromString(storyId);
            StoryQuizDTO quiz = quizService.getQuizByStoryId(uuid);
            return ResponseEntity.ok(quiz);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(null);
        }
    }
}
