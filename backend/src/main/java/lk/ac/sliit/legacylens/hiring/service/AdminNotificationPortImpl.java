package lk.ac.sliit.legacylens.hiring.service;

import lk.ac.sliit.legacylens.hiring.entity.AdminTaskQueueEntry;
import lk.ac.sliit.legacylens.hiring.repository.AdminTaskQueueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Placeholder implementation until the Admin/Archive module exists: just
 * inserts a row into a shared task-queue table. That module owns consuming
 * these rows; this class's only job is to make sure one gets created.
 */
@Service
public class AdminNotificationPortImpl implements AdminNotificationPort {

    private static final String JOB_REQUEST_REVIEW_TASK_TYPE = "JOB_REQUEST_REVIEW";

    private final AdminTaskQueueRepository adminTaskQueueRepository;

    public AdminNotificationPortImpl(AdminTaskQueueRepository adminTaskQueueRepository) {
        this.adminTaskQueueRepository = adminTaskQueueRepository;
    }

    @Override
    @Transactional
    public void notify(UUID jobRequestId) {
        AdminTaskQueueEntry entry = new AdminTaskQueueEntry();
        entry.setTaskType(JOB_REQUEST_REVIEW_TASK_TYPE);
        entry.setReferenceId(jobRequestId);

        adminTaskQueueRepository.save(entry);
    }
}
