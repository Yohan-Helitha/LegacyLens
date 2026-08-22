package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping("/tracks/{trackId}/lessons")
    public ResponseEntity<List<Lesson>> getLessonsByTrack(
            @PathVariable Long trackId) {

        return ResponseEntity.ok(
                lessonService.getLessonsByTrackId(trackId)
        );
    }

    @GetMapping("/lessons/{id}")
    public ResponseEntity<Lesson> getLessonById(
            @PathVariable Long id) {

        return lessonService.getLessonById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/lessons")
    public ResponseEntity<Lesson> createLesson(
            @RequestBody Lesson lesson) {

        return ResponseEntity.ok(
                lessonService.createLesson(lesson)
        );
    }
}