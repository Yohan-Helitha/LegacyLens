package lk.ac.sliit.legacylens.marketplace.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class OpportunityUrgencyTest {

    @Test
    void anOpportunityMarkedUrgent_isUrgent_whateverItsDate() {
        Opportunity opportunity = new Opportunity();
        opportunity.setUrgent(true);
        opportunity.setDueAt(LocalDateTime.now().plusDays(30));

        assertThat(opportunity.isUrgent()).isTrue();
    }

    @Test
    void aDeadlineWithinThreeDays_makesItUrgent_withoutAnyoneMarkingIt() {
        Opportunity opportunity = new Opportunity();
        opportunity.setDueAt(LocalDateTime.now().plusDays(2));

        assertThat(opportunity.isUrgent()).isTrue();
    }

    @Test
    void aDeadlineFurtherAway_isNotUrgent() {
        Opportunity opportunity = new Opportunity();
        opportunity.setDueAt(LocalDateTime.now().plusDays(10));

        assertThat(opportunity.isUrgent()).isFalse();
    }

    @Test
    void aDeadlineAlreadyPast_isNotUrgent() {
        Opportunity opportunity = new Opportunity();
        opportunity.setDueAt(LocalDateTime.now().minusDays(1));

        assertThat(opportunity.isUrgent()).isFalse();
    }

    @Test
    void withNoDeadline_theWorkDayDecides() {
        Opportunity soon = new Opportunity();
        soon.setScheduledDate(LocalDate.now().plusDays(1));
        Opportunity today = new Opportunity();
        today.setScheduledDate(LocalDate.now());
        Opportunity later = new Opportunity();
        later.setScheduledDate(LocalDate.now().plusDays(20));
        Opportunity past = new Opportunity();
        past.setScheduledDate(LocalDate.now().minusDays(1));

        assertThat(soon.isUrgent()).isTrue();
        assertThat(today.isUrgent()).isTrue();
        assertThat(later.isUrgent()).isFalse();
        assertThat(past.isUrgent()).isFalse();
    }

    @Test
    void withNoDatesAtAll_andNotMarked_itIsNotUrgent() {
        assertThat(new Opportunity().isUrgent()).isFalse();
    }
}
