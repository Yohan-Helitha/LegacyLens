package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.dto.PagedResponse;
import lk.ac.sliit.legacylens.contentcapture.dto.StorySummaryDto;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Read-only access to a storyteller's own stories (search/filter/paginate).
 * Deliberately separate from StoryService (which owns create/update/delete)
 * — a caller that only needs to browse stories shouldn't have to depend on
 * an interface that also exposes write operations (Interface Segregation).
 */
public interface StoryQueryService {

    /** statusFilter and searchTerm are both optional (null = no filter). */
    PagedResponse<StorySummaryDto> getMyStories(UUID userId, StoryStatus statusFilter, String searchTerm, Pageable pageable);
}
