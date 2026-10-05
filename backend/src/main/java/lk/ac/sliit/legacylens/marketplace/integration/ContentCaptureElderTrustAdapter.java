package lk.ac.sliit.legacylens.marketplace.integration;

import lk.ac.sliit.legacylens.contentcapture.service.TrustScoreService;
import lk.ac.sliit.legacylens.marketplace.service.ElderTrustLookup;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Reads an elder's trust from the content-capture module, where it is earned by sharing stories. */
@Component
public class ContentCaptureElderTrustAdapter implements ElderTrustLookup {

    /** The highest trust level there is - one more than the number of story milestones (see StoryCountBasedCalculator). */
    static final int MAX_LEVEL = 4;

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
            return null; // trust only fine-tunes the ranking - never fail a recommendation over it
        }
    }
}
