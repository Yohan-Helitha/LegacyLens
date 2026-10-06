package lk.ac.sliit.legacylens.marketplace.integration;

import lk.ac.sliit.legacylens.contentcapture.service.TrustScoreService;
import lk.ac.sliit.legacylens.marketplace.matching.ElderTrustLookup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Reads an elder's trust from the content-capture module, where it is earned by sharing stories. */
@Component
public class ContentCaptureElderTrustAdapter implements ElderTrustLookup {

    /** The highest trust level there is - one more than the number of story milestones (see StoryCountBasedCalculator). */
    static final int MAX_LEVEL = 4;

    private static final Logger log = LoggerFactory.getLogger(ContentCaptureElderTrustAdapter.class);

    private final TrustScoreService trustScoreService;

    public ContentCaptureElderTrustAdapter(TrustScoreService trustScoreService) {
        this.trustScoreService = trustScoreService;
    }

    @Override
    public Double trustOf(UUID elderId) {
        if (elderId == null) {
            return null;
        }
        try {
            return Math.min(trustScoreService.getDetail(elderId).getLevel(), MAX_LEVEL) / (double) MAX_LEVEL;
        } catch (RuntimeException e) {
            // Trust only fine-tunes the ranking, so never fail a recommendation over it - but say so, or
            // a broken lookup would quietly make every elder score as "average trust".
            log.warn("Could not read the trust level of elder {}; scoring with the middle value instead", elderId, e);
            return null;
        }
    }
}
