package lk.ac.sliit.legacylens.learning.controller;

import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.service.LearningTrackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning/tracks")
public class LearningTrackController {

    private final LearningTrackService learningTrackService;

    public LearningTrackController(LearningTrackService learningTrackService) {
        this.learningTrackService = learningTrackService;
    }

    @GetMapping
    public ResponseEntity<List<LearningTrack>> getAllTracks() {
        return ResponseEntity.ok(learningTrackService.getAllTracks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningTrack> getTrackById(@PathVariable Long id) {
        return learningTrackService.getTrackById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LearningTrack> createTrack(
            @RequestBody LearningTrack learningTrack) {

        return ResponseEntity.ok(
                learningTrackService.createTrack(learningTrack)
        );
    }
}