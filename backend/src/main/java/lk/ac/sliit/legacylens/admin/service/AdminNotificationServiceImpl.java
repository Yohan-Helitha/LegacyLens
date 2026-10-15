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
import lk.ac.sliit.legacylens.admin.entity.AudioReviewStatus;
import lk.ac.sliit.legacylens.admin.entity.OpportunityAudio;
import lk.ac.sliit.legacylens.admin.repository.OpportunityAudioRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminNotificationServiceImpl implements AdminNotificationService {

    private final OpportunityRepository opportunityRepository;
    private final ModerationQueueRepository moderationQueueRepository;
    private final OpportunityAudioRepository opportunityAudioRepository;
    private final java.util.Set<String> readNotificationIds = java.util.concurrent.ConcurrentHashMap.newKeySet();
    private final CreatorApplicationRepository creatorApplicationRepository;
    private final JobWorkProgressRepository workProgressRepository;

    @Override
    public List<AdminNotificationResponse> getAdminNotifications() {
        List<AdminNotificationResponse> notifications = new ArrayList<>();

        // Fetch Opportunity Audio Submissions (Field Recordings for Intake Queue)
        List<OpportunityAudio> audios = opportunityAudioRepository.findAll();
        for (OpportunityAudio audio : audios) {
            String audioId = audio.getId().toString();
            boolean read = readNotificationIds.contains(audioId) || audio.getStatus() == AudioReviewStatus.FULLY_LISTENED;
            notifications.add(AdminNotificationResponse.builder()
                    .id(audioId)
                    .title("Audio Submission: " + (audio.getElderName() != null ? audio.getElderName() : "Elder Knowledge Keeper"))
                    .subtitle("Opportunity Intake • " + (audio.getTopic() != null ? audio.getTopic() : "Cultural Archive"))
                    .body("New audio submission awaiting review and transcription from " + (audio.getLocation() != null ? audio.getLocation() : "Sri Lanka") + ".")
                    .createdAt(audio.getCreatedAt() != null ? audio.getCreatedAt() : java.time.LocalDateTime.now())
                    .type("opportunity")
                    .isRead(read)
                    .build());
        }

        // Fetch Opportunities
        List<Opportunity> opportunities = opportunityRepository.findAll();
        for (Opportunity opp : opportunities) {
            String oppId = opp.getId().toString();
            boolean read = readNotificationIds.contains(oppId) || opp.isRead();
            notifications.add(AdminNotificationResponse.builder()
                    .id(oppId)
                    .title(opp.getTitle() != null ? opp.getTitle() : "Opportunity")
                    .subtitle("Opportunity Listing")
                    .body("Opportunity status: " + opp.getStatus())
                    .createdAt(opp.getCreatedAt())
                    .type("opportunity")
                    .isRead(read)
                    .build());
        }

        // Fetch Moderation Items
        List<ModerationQueueItem> modItems = moderationQueueRepository.findByStatus(StoryStatus.PENDING);
        for (ModerationQueueItem mod : modItems) {
            String modId = mod.getId().toString();
            boolean read = readNotificationIds.contains(modId) || mod.isRead();
            notifications.add(AdminNotificationResponse.builder()
                    .id(modId)
                    .title(mod.getTitle() != null ? mod.getTitle() : "Reported Content")
                    .subtitle("Moderation Queue")
                    .body("Received a report requiring moderation review.")
                    .createdAt(mod.getCreatedAt())
                    .type("moderation")
                    .isRead(read)
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
        if (id != null) {
            readNotificationIds.add(id);
        }
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
            readNotificationIds.add(opp.getId().toString());
            if (!opp.isRead()) {
                opp.setRead(true);
                opportunityRepository.save(opp);
            }
        }

        List<ModerationQueueItem> mods = moderationQueueRepository.findByStatus(StoryStatus.PENDING);
        for (ModerationQueueItem mod : mods) {
            readNotificationIds.add(mod.getId().toString());
            if (!mod.isRead()) {
                mod.setRead(true);
                moderationQueueRepository.save(mod);
            }
        }
    }
}
