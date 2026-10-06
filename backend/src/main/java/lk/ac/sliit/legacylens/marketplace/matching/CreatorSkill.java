package lk.ac.sliit.legacylens.marketplace.service;

import java.util.List;

import static lk.ac.sliit.legacylens.marketplace.service.TextMatching.containsStem;

/** A kind of work a creator can do. Recognised from free-text skill tags via stems. */
public enum CreatorSkill {
    VIDEOGRAPHY("videography", "video", "videograph", "film", "cinematograph", "camera operat", "drone", "youtube", "editing"),
    PHOTOGRAPHY("photography", "photo", "camera", "portrait"),
    AUDIO("audio recording", "audio", "sound", "podcast", "recording", "voice"),
    WRITING("writing", "writ", "script", "transcri", "article", "blog", "journal", "documentation", "copy"),
    INTERVIEWING("interviewing", "interview", "oral history", "storytell", "research", "reporter"),
    TRANSLATION("translation", "translat", "interpret");

    final String label;
    private final List<String> stems;

    CreatorSkill(String label, String... stems) {
        this.label = label;
        this.stems = List.of(stems);
    }

    boolean matches(String lowerText) {
        return stems.stream().anyMatch(stem -> containsStem(lowerText, stem));
    }
}
