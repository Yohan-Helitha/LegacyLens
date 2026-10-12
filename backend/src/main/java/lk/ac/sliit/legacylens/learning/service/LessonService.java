package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.entity.Lesson;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
		List<Lesson> lessons = lessonRepository.findByTrackIdOrderByLessonOrderAsc(trackId);

		return lessons;
	}

	public Lesson getLessonById(Long id) {
		Lesson lesson = lessonRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));

		return lesson;
	}

	@Transactional
	public Lesson createLesson(Long trackId, Lesson lesson) {
		LearningTrack track = learningTrackRepository.findById(trackId)
				.orElseThrow(() -> new ResourceNotFoundException("Learning track not found"));
		Lesson savedLesson = null;
		int lessonCount = 0;

		if (lesson.getLessonOrder() == null) {
			throw new IllegalArgumentException("Lesson order is required");
		}

		if (lessonRepository.existsByTrackIdAndLessonOrder(trackId, lesson.getLessonOrder())) {
			throw new IllegalArgumentException("A lesson with this order already exists for this track");
		}

		lesson.setTrack(track);
		savedLesson = lessonRepository.save(lesson);

		lessonCount = (int) lessonRepository.countByTrackId(trackId);
		track.setTotalLessons(lessonCount);
		learningTrackRepository.save(track);

		return savedLesson;
	}

	@Transactional
	public Lesson updateLesson(Long id, Lesson updatedLesson) {
		Lesson savedLesson = lessonRepository.findById(id).map(existingLesson -> {
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

		return savedLesson;
	}

	@Transactional
	public void deleteLesson(Long id) {
		Lesson lesson = lessonRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
		LearningTrack track = lesson.getTrack();
		int lessonCount = 0;

		lessonRepository.delete(lesson);

		lessonCount = (int) lessonRepository.countByTrackId(track.getId());
		track.setTotalLessons(lessonCount);
		learningTrackRepository.save(track);
	}
}