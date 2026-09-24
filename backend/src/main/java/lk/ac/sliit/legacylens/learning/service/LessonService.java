package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lesson not found"
                        ));
    }

    public Lesson createLesson(Long trackId, Lesson lesson) {

        LearningTrack track =
                learningTrackRepository.findById(trackId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Learning track not found"
                                ));

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

    public Lesson updateLesson(Long id, Lesson updatedLesson) {
        return lessonRepository.findById(id).map(existingLesson -> {
            if (updatedLesson.getLessonOrder() != null && !existingLesson.getLessonOrder().equals(updatedLesson.getLessonOrder())) {
                if (lessonRepository.existsByTrackIdAndLessonOrder(existingLesson.getTrack().getId(), updatedLesson.getLessonOrder())) {
                    throw new IllegalArgumentException("A lesson with this order already exists for this track");
                }
                existingLesson.setLessonOrder(updatedLesson.getLessonOrder());
            }
            existingLesson.setTitle(updatedLesson.getTitle());
            existingLesson.setDescription(updatedLesson.getDescription());
            return lessonRepository.save(existingLesson);
        }).orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
    }

    public void deleteLesson(Long id) {
        Lesson lesson = lessonRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        LearningTrack track = lesson.getTrack();
        lessonRepository.delete(lesson);
        
        int lessonCount = lessonRepository.findByTrackIdOrderByLessonOrderAsc(track.getId()).size();
        track.setTotalLessons(lessonCount);
        learningTrackRepository.save(track);
    }
}