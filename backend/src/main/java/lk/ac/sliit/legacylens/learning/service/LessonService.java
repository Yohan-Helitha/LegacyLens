package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final LearningTrackRepository learningTrackRepository;

    public LessonService(
            LessonRepository lessonRepository,
            LearningTrackRepository learningTrackRepository) {

        this.lessonRepository = lessonRepository;
        this.learningTrackRepository = learningTrackRepository;
    }

    public List<Lesson> getLessonsByTrackId(Long trackId) {
        return lessonRepository.findByTrackIdOrderByLessonOrderAsc(trackId);
    }

    public Optional<Lesson> getLessonById(Long id) {
        return lessonRepository.findById(id);
    }

    public Lesson createLesson(Long trackId, Lesson lesson) {

        LearningTrack track =
                learningTrackRepository.findById(trackId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Learning track not found"
                                )
                        );

        if (lesson.getLessonOrder() == null) {
            throw new IllegalArgumentException(
                    "Lesson order is required"
            );
        }

        if (lessonRepository.existsByTrackIdAndLessonOrder(
                trackId,
                lesson.getLessonOrder())) {

            throw new IllegalArgumentException(
                    "A lesson with this order already exists for this track"
            );
        }

        lesson.setTrack(track);

        Lesson savedLesson =
                lessonRepository.save(lesson);

        int lessonCount =
                lessonRepository
                        .findByTrackIdOrderByLessonOrderAsc(trackId)
                        .size();

        track.setTotalLessons(lessonCount);

        learningTrackRepository.save(track);

        return savedLesson;
    }



}