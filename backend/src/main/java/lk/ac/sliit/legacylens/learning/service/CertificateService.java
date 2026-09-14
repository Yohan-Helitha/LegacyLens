package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.CertificateResponse;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Generates a completion certificate for a track.
 *
 * Note on userId: this deliberately does NOT resolve the learner's name
 * through the Long "userId" used elsewhere in this module (that value is
 * actually the user's phone number parsed as a long — see the auth/learning
 * userId mismatch flagged separately). The caller passes the real full name
 * from the authenticated User entity instead; this service only uses the
 * Long userId to check lesson-progress records, which is what it's
 * consistently used for today.
 */
@Service
public class CertificateService {

    private final LearningTrackRepository learningTrackRepository;
    private final LessonProgressRepository lessonProgressRepository;

    public CertificateService(
            LearningTrackRepository learningTrackRepository,
            LessonProgressRepository lessonProgressRepository) {

        this.learningTrackRepository = learningTrackRepository;
        this.lessonProgressRepository = lessonProgressRepository;
    }

    public CertificateResponse getCertificate(
            Long userId,
            String learnerName,
            Long trackId) {

        LearningTrack track = learningTrackRepository.findById(trackId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Track not found"));

        int totalLessons =
                track.getTotalLessons() == null ? 0 : track.getTotalLessons();

        long completedLessons =
                lessonProgressRepository
                        .countByUserIdAndLesson_Track_IdAndCompletedTrue(
                                userId,
                                trackId
                        );

        if (totalLessons == 0 || completedLessons < totalLessons) {
            throw new IllegalArgumentException(
                    "This track hasn't been completed yet"
            );
        }

        LocalDateTime completedAt =
                lessonProgressRepository.findLatestCompletionForTrack(
                        userId,
                        trackId
                );

        LocalDate completionDate =
                completedAt != null
                        ? completedAt.toLocalDate()
                        : LocalDate.now();

        String formattedDate = completionDate.format(
                DateTimeFormatter.ofPattern("d MMMM yyyy")
        );

        return new CertificateResponse(
                track.getId(),
                track.getTitle(),
                learnerName,
                formattedDate
        );
    }
}