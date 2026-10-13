package lk.ac.sliit.legacylens.learning.dto;

import java.util.List;

public class StreakResponse {

    private int currentStreakDays;
    private List<Boolean> last7Days;

    public StreakResponse(
            int currentStreakDays,
            List<Boolean> last7Days) {

        this.currentStreakDays = currentStreakDays;
        this.last7Days = last7Days;
    }

    public int getCurrentStreakDays() {
        return currentStreakDays;
    }

    public List<Boolean> getLast7Days() {
        return last7Days;
    }
}