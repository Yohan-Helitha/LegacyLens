package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.dto.PagedResponse;
import lk.ac.sliit.legacylens.contentcapture.dto.StorySummaryDto;
import lk.ac.sliit.legacylens.contentcapture.repository.StorySpecifications;
import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import lk.ac.sliit.legacylens.stories.repository.StoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class StoryQueryServiceImpl implements StoryQueryService {

    private final StoryRepository storyRepository;

    public StoryQueryServiceImpl(StoryRepository storyRepository) {
        this.storyRepository = storyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<StorySummaryDto> getMyStories(
            UUID userId, StoryStatus statusFilter, String searchTerm, Pageable pageable) {

        Specification<Story> spec = Specification
                .where(StorySpecifications.ownedBy(userId))
                .and(StorySpecifications.hasStatus(statusFilter))
                .and(StorySpecifications.titleContains(searchTerm));

        Page<Story> page = storyRepository.findAll(spec, pageable);

        return PagedResponse.from(page.map(this::toSummary));
    }

    private StorySummaryDto toSummary(Story story) {
        String mediaUrl = story.getMediaFilePath() != null ? "/uploads/" + story.getMediaFilePath() : null;

        return StorySummaryDto.builder()
                .id(story.getId())
                .title(story.getTitle())
                .status(story.getStatus().name())
                .mediaType(story.getMediaType() != null ? story.getMediaType().name() : null)
                .mediaUrl(mediaUrl)
                .viewCount(story.getViewCount())
                .createdAt(story.getCreatedAt())
                .build();
    }
}
