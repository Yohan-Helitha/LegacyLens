package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.dto.BadgeResponse;
import lk.ac.sliit.legacylens.learning.dto.StreakResponse;
import lk.ac.sliit.legacylens.learning.dto.TrackProgressResponse;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Badges are not stored — they are derived on the fly from existing
 * track-progress and streak data, the same way streaks are computed in
 * LessonProgressService. This keeps things simple: no new table, no
 * risk of the "earned" flag going stale.
 *
 * Trade-off: we don't persist the exact date a badge was unlocked, so
 * earnedDate isn't available yet. Add a badges table later if that's
 * ever needed (e.g. to show "earned on 12 Aug").
 */
@Service
public class BadgeService {

    private final LessonProgressService lessonProgressService;

    public BadgeService(LessonProgressService lessonProgressService) {
        this.lessonProgressService = lessonProgressService;
    }

    public List<BadgeResponse> getMyBadges(Long userId) {

        List<TrackProgressResponse> trackProgress =
                lessonProgressService.getUserTrackProgress(userId);

        long tracksStarted = trackProgress.stream()
                .filter(t -> t.getCompletedLessons() > 0)
                .count();

        long tracksCompleted = trackProgress.stream()
                .filter(t -> t.getTotalLessons() > 0
                        && t.getCompletedLessons() >= t.getTotalLessons())
                .count();

        StreakResponse streak = lessonProgressService.getStreak(userId);

        return List.of(
                new BadgeResponse(
                        "first-track-started",
                        "First Track Started",
                        "Started your first learning track",
                        tracksStarted >= 1,
                        "Start any track to unlock"
                ),
                new BadgeResponse(
                        "five-day-streak",
                        "5 Day Streak",
                        "Learned 5 days in a row",
                        streak.getCurrentStreakDays() >= 5,
                        "Learn 5 days in a row to unlock"
                ),
                new BadgeResponse(
                        "track-master",
                        "Track Master",
                        "Complete 3 tracks",
                        tracksCompleted >= 3,
                        "Complete 3 tracks to unlock"
                )
        );
    }
}