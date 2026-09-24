package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import static lk.ac.sliit.legacylens.hiring.entity.JobRequestStatus.*;

/**
 * Single source of truth for legal JobRequest status transitions — kept as
 * its own class (a separate one from the content module's future
 * ContentStateMachine, even though the pattern is the same) since job
 * request transitions differ: they include an admin-gated state that
 * content review doesn't have. This module drives DRAFT -> PENDING_ADMIN_REVIEW
 * (JobRequestService) and PUBLISHED -> CLOSED (JobApplicationReviewService);
 * PENDING_ADMIN_REVIEW -> PUBLISHED/REJECTED are legal transitions this class
 * recognizes but only an admin action (a module not yet built) triggers them.
 */
@Component
public class JobRequestStateMachine {

    private static final Map<JobRequestStatus, Set<JobRequestStatus>> TRANSITIONS = new EnumMap<>(JobRequestStatus.class);

    static {
        TRANSITIONS.put(DRAFT, Set.of(PENDING_ADMIN_REVIEW));
        TRANSITIONS.put(PENDING_ADMIN_REVIEW, Set.of(PUBLISHED, REJECTED));
        TRANSITIONS.put(PUBLISHED, Set.of(CLOSED));
        TRANSITIONS.put(REJECTED, Set.of());
        TRANSITIONS.put(CLOSED, Set.of());
    }

    public boolean canTransition(JobRequestStatus from, JobRequestStatus to) {
        return TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
    }
}
