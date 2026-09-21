package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.common.dto.PagedResponse;
import lk.ac.sliit.legacylens.contentcapture.dto.RatingSummaryDto;
import lk.ac.sliit.legacylens.contentcapture.dto.ReviewResponseDto;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** Read path for ratings — powers the scrollable reviews list and the average+count summary on an elder's profile. */
public interface ReviewQueryService {

    PagedResponse<ReviewResponseDto> getReviews(UUID elderId, Pageable pageable);

    RatingSummaryDto getSummary(UUID elderId);
}
