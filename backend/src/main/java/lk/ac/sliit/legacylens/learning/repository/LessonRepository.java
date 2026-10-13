package lk.ac.sliit.legacylens.learning.repository;

import lk.ac.sliit.legacylens.learning.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

	List<Lesson> findByTrackIdOrderByLessonOrderAsc(Long trackId);

	long countByTrackId(Long trackId);

	long countByTrack_OriginAndTrack_Visibility(String origin, String visibility);

	long countByTrack_OwnerUserId(java.util.UUID ownerUserId);

	boolean existsByTrackIdAndLessonOrder(
			Long trackId,
			Integer lessonOrder
	);
}