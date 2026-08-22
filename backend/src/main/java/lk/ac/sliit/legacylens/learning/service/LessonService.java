package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;

    public LessonService(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    public List<Lesson> getLessonsByTrackId(Long trackId) {
        return lessonRepository.findByTrackIdOrderByLessonOrderAsc(trackId);
    }

    public Optional<Lesson> getLessonById(Long id) {
        return lessonRepository.findById(id);
    }

    public Lesson createLesson(Lesson lesson) {
        return lessonRepository.save(lesson);
    }
}