package lk.ac.sliit.legacylens.moderation.service;

import jakarta.annotation.PostConstruct;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.moderation.dto.ModerationQueueItemResponse;
import lk.ac.sliit.legacylens.moderation.dto.UpdateModerationStatusRequest;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.entity.ModerationStatus;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ModerationQueueServiceImpl implements ModerationQueueService {

    private static final Logger log = LoggerFactory.getLogger(ModerationQueueServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ModerationQueueRepository moderationQueueRepository;

    public ModerationQueueServiceImpl(ModerationQueueRepository moderationQueueRepository) {
        this.moderationQueueRepository = moderationQueueRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModerationQueueItemResponse> getAllItems(String statusFilter) {
        List<ModerationQueueItem> items;
        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            items = moderationQueueRepository.findAll();
        } else {
            try {
                ModerationStatus status = ModerationStatus.valueOf(statusFilter.toUpperCase());
                items = moderationQueueRepository.findByStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid ModerationStatus filter '{}', returning all items", statusFilter);
                items = moderationQueueRepository.findAll();
            }
        }
        return items.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationQueueItemResponse getItem(UUID id) {
        ModerationQueueItem item = moderationQueueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Moderation item not found"));
        return mapToResponse(item);
    }

    @Override
    @Transactional
    public ModerationQueueItemResponse updateItemStatus(UUID id, UpdateModerationStatusRequest request) {
        ModerationQueueItem item = moderationQueueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Moderation item not found"));

        ModerationStatus newStatus;
        try {
            newStatus = ModerationStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            newStatus = ModerationStatus.PENDING;
        }
        item.setStatus(newStatus);

        if (newStatus == ModerationStatus.REJECTED) {
            item.setRejectionReason(request.getRejectionReason());
            item.setRejectionNotes(request.getRejectionNotes());
        } else {
            item.setRejectionReason(null);
            item.setRejectionNotes(null);
        }

        ModerationQueueItem saved = moderationQueueRepository.save(item);
        log.info("Updated moderation item {} status to {}", id, newStatus);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteItem(UUID id) {
        if (!moderationQueueRepository.existsById(id)) {
            throw new ResourceNotFoundException("Moderation item not found");
        }
        moderationQueueRepository.deleteById(id);
        log.info("Deleted moderation item {}", id);
    }

    private ModerationQueueItemResponse mapToResponse(ModerationQueueItem item) {
        String authorName = item.getAuthorName();
        String authorId = item.getAuthorId() != null ? item.getAuthorId().toString()
                : (item.getAuthorUserId() != null ? item.getAuthorUserId().toString() : null);

        return ModerationQueueItemResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .bodyContent(item.getBodyContent())
                .imageUrl(item.getImageUrl())
                .type(item.getType() != null ? item.getType() : item.getMethod())
                .authorName(authorName)
                .authorUserId(authorId)
                .elder(item.isElder())
                .tags(item.getTags() != null ? item.getTags() : new String[0])
                .status(item.getStatus() != null ? item.getStatus().name() : "PENDING")
                .rejectionReason(item.getRejectionReason())
                .rejectionNotes(item.getRejectionNotes())
                .createdAt(item.getCreatedAt() != null ? item.getCreatedAt().format(DATE_FORMATTER) : null)
                .updatedAt(item.getUpdatedAt() != null ? item.getUpdatedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
