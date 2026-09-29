package lk.ac.sliit.legacylens.hiring.service;

import org.junit.jupiter.api.Test;

import static lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class JobRequestStateMachineTest {

    private final JobRequestStateMachine stateMachine = new JobRequestStateMachine();

    @Test
    void canTransition_draftToPendingAdminReview_true() {
        assertThat(stateMachine.canTransition(DRAFT, PENDING_ADMIN_REVIEW)).isTrue();
    }

    /**
     * This transition is a legal state in the domain model — but nothing in
     * this (elder-side) module ever calls it. Only a future Admin module
     * action would drive PENDING_ADMIN_REVIEW -> PUBLISHED.
     */
    @Test
    void canTransition_pendingToPublished_onlyViaAdminAction() {
        assertThat(stateMachine.canTransition(PENDING_ADMIN_REVIEW, PUBLISHED)).isTrue();
    }

    @Test
    void canTransition_pendingToRejected_true() {
        assertThat(stateMachine.canTransition(PENDING_ADMIN_REVIEW, REJECTED)).isTrue();
    }

    @Test
    void canTransition_publishedToClosed_true() {
        assertThat(stateMachine.canTransition(PUBLISHED, CLOSED)).isTrue();
    }

    @Test
    void canTransition_draftToPublished_false() {
        assertThat(stateMachine.canTransition(DRAFT, PUBLISHED)).isFalse();
    }

    @Test
    void canTransition_closedToAnything_false() {
        assertThat(stateMachine.canTransition(CLOSED, PUBLISHED)).isFalse();
        assertThat(stateMachine.canTransition(CLOSED, DRAFT)).isFalse();
    }
}
