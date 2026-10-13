package lk.ac.sliit.legacylens.admin.service;

import lk.ac.sliit.legacylens.admin.dto.AdminNotificationResponse;
import lk.ac.sliit.legacylens.marketplace.entity.CreatorApplication;
import lk.ac.sliit.legacylens.marketplace.entity.JobStatus;
import lk.ac.sliit.legacylens.marketplace.entity.JobWorkProgress;
import lk.ac.sliit.legacylens.marketplace.entity.Opportunity;
import lk.ac.sliit.legacylens.marketplace.repository.CreatorApplicationRepository;
import lk.ac.sliit.legacylens.marketplace.repository.JobWorkProgressRepository;
import lk.ac.sliit.legacylens.users.entity.VerificationStatus;
import lk.ac.sliit.legacylens.marketplace.repository.OpportunityRepository;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminNotificationServiceImpl implements AdminNotificationService {

    private final OpportunityRepository opportunityRepository;
    private final ModerationQueueRepository moderationQueueRepository;
    private final CreatorApplicationRepository creatorApplicationRepository;
    private final JobWorkProgressRepository workProgressRepository;

    @Override
    public List<AdminNotificationResponse> getAdminNotifications() {
        List<AdminNotificationResponse> notifications = new ArrayList<>();

        // Fetch Opportunities
        List<Opportunity> opportunities = opportunityRepository.findAll();
        for (Opportunity opp : opportunities) {
            notifications.add(AdminNotificationResponse.builder()
                    .id(opp.getId().toString())
                    .title(opp.getTitle() != null ? opp.getTitle() : "Opportunity")
                    .subtitle("Opportunity Intake")
                    .body("New opportunity for review.")
                    .createdAt(opp.getCreatedAt())
                    .type("opportunity")
                    .isRead(opp.isRead())
                    .build());
        }

        // Fetch Moderation Items
        List<ModerationQueueItem> modItems = moderationQueueRepository.findByStatus(StoryStatus.PENDING);
        for (ModerationQueueItem mod : modItems) {
            notifications.add(AdminNotificationResponse.builder()
                    .id(mod.getId().toString())
                    .title(mod.getTitle() != null ? mod.getTitle() : "Reported Content")
                    .subtitle("Moderation Queue")
                    .body("Received a report requiring moderation review.")
                    .createdAt(mod.getCreatedAt())
                    .type("moderation")
                    .isRead(mod.isRead())
                    .build());
        }

        // Creator applications waiting for a decision. These leave the list once decided, so they carry no read flag.
        for (CreatorApplication application : creatorApplicationRepository.findByStatus(VerificationStatus.PENDING)) {
            notifications.add(AdminNotificationResponse.builder()
                    .id(application.getId().toString())
                    .title(application.getFullName())
                    .subtitle("Creator Application")
                    .body("Applied to become a content creator.")
                    .createdAt(application.getSubmittedAt())
                    .type("creator-application")
                    .isRead(false)
                    .build());
        }

        // Submitted work still waiting for the admin's go-ahead (or sent back and not yet resubmitted is excluded).
        for (JobWorkProgress progress : workProgressRepository.findBySubmittedAtIsNotNullAndDraftFalseOrderBySubmittedAtDesc()) {
            if (progress.isRejected() || progress.isAdminApproved() || progress.getJob().getStatus() == JobStatus.COMPLETED) {
                continue;
            }
            notifications.add(AdminNotificationResponse.builder()
                    .id(progress.getJob().getId().toString())
                    .title(progress.getJob().getTitle())
                    .subtitle("Work Submission")
                    .body(progress.getJob().getCreator().getFullName() + " submitted work for review.")
                    .createdAt(progress.getSubmittedAt())
                    .type("work-submission")
                    .isRead(false)
                    .build());
        }

        notifications.sort(Comparator.comparing(
                AdminNotificationResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return notifications;
    }

    @Override
    @Transactional
    public void markNotificationAsRead(String type, String id) {
        if ("opportunity".equals(type)) {
            opportunityRepository.findById(UUID.fromString(id)).ifPresent(opp -> {
                opp.setRead(true);
                opportunityRepository.save(opp);
            });
        } else if ("moderation".equals(type)) {
            moderationQueueRepository.findById(UUID.fromString(id)).ifPresent(mod -> {
                mod.setRead(true);
                moderationQueueRepository.save(mod);
            });
        }
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        List<Opportunity> opps = opportunityRepository.findAll();
        for (Opportunity opp : opps) {
            if (!opp.isRead()) {
                opp.setRead(true);
                opportunityRepository.save(opp);
            }
        }

        List<ModerationQueueItem> mods = moderationQueueRepository.findByStatus(StoryStatus.PENDING);
        for (ModerationQueueItem mod : mods) {
            if (!mod.isRead()) {
                mod.setRead(true);
                moderationQueueRepository.save(mod);
            }
        }
    }
}
