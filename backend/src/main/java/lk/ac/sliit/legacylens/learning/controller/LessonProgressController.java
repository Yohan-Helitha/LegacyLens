package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.dto.LessonProgressResponse;
import lk.ac.sliit.legacylens.learning.entity.LessonProgress;
import lk.ac.sliit.legacylens.learning.service.LessonProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.List;

@RestController
@RequestMapping("/api/learning/progress")
public class LessonProgressController {

    private final LessonProgressService lessonProgressService;

    public LessonProgressController(
            LessonProgressService lessonProgressService) {
        this.lessonProgressService = lessonProgressService;
    }

    @GetMapping("/{userId}/lessons/{lessonId}")
    public ResponseEntity<LessonProgress> getProgress(
            @PathVariable Long userId,
            @PathVariable Long lessonId) {

        return lessonProgressService
                .getProgress(userId, lessonId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<LessonProgress>> getUserProgress(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                lessonProgressService.getUserProgress(userId)
        );
    }

    @PutMapping("/{userId}/lessons/{lessonId}")
    public ResponseEntity<LessonProgress> updateProgress(
            @PathVariable Long userId,
            @PathVariable Long lessonId,
            @RequestParam boolean completed,
            @RequestParam Integer score,
            @RequestParam Integer xpEarned) {

        return ResponseEntity.ok(
                lessonProgressService.updateProgress(
                        userId,
                        lessonId,
                        completed,
                        score,
                        xpEarned
                )
        );
    }

    @PutMapping("/me/lessons/{lessonId}")
    public ResponseEntity<LessonProgressResponse> updateMyProgress(
            Authentication authentication,
            @PathVariable Long lessonId,
            @RequestParam boolean completed,
            @RequestParam Integer score,
            @RequestParam Integer xpEarned) {

        Long userId = Long.valueOf(authentication.getName());

        LessonProgress progress = lessonProgressService.updateProgress(
                userId,
                lessonId,
                completed,
                score,
                xpEarned
        );

        LessonProgressResponse response = new LessonProgressResponse(
                progress.getLesson().getId(),
                progress.isCompleted(),
                progress.getScore(),
                progress.getXpEarned()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<LessonProgressResponse>> getMyProgress(
            Authentication authentication) {

        Long userId = Long.valueOf(authentication.getName());

        return ResponseEntity.ok(
                lessonProgressService.getUserProgressResponse(userId)
        );
    }

    @GetMapping("/me/lessons/{lessonId}")
    public ResponseEntity<LessonProgressResponse> getMyLessonProgress(
            Authentication authentication,
            @PathVariable Long lessonId) {

        Long userId = Long.valueOf(authentication.getName());

        return lessonProgressService
                .getProgressResponse(userId, lessonId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}