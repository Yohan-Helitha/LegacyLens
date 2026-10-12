package lk.ac.sliit.legacylens.contentcapture.service;

import lk.ac.sliit.legacylens.contentcapture.dto.TrustScoreDetailDto;

import java.util.UUID;

public interface TrustScoreService {

    /** Level is always computed fresh from published-story counts — never stored, to avoid drift. */
    TrustScoreDetailDto getDetail(UUID userId);
}
