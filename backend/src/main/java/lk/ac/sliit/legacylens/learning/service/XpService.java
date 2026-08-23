package lk.ac.sliit.legacylens.learning.service;

import org.springframework.stereotype.Service;

@Service
public class XpService {

    private static final int XP_PER_CORRECT_ANSWER = 10;
    private static final int XP_COMPLETION_BONUS = 20;

    public int calculateQuizXp(int correctAnswers, boolean completed) {

        if (correctAnswers < 0) {
            throw new IllegalArgumentException(
                    "Correct answers cannot be negative"
            );
        }

        int xp = correctAnswers * XP_PER_CORRECT_ANSWER;

        if (completed) {
            xp += XP_COMPLETION_BONUS;
        }

        return xp;
    }
}