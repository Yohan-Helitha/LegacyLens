package lk.ac.sliit.legacylens.stories.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;

/**
 * Same pattern as ModerationStatusConverter (moderation/converter) — the
 * `stories` table is also written by the admin moderation side using its own
 * ModerationStatus vocabulary (PENDING/PUBLISHED/REJECTED/ARCHIVED), which is
 * wider than StoryStatus today. Without this converter, Hibernate's default
 * EnumType.STRING mapping throws on any status value StoryStatus doesn't
 * define, which fails the *entire* query for whichever elder owns that row —
 * not just that one story. Falling back to PENDING is a stopgap, not a real
 * fix: see STORY_STATUS_LIFECYCLE_PLAN.md for reconciling the two enums.
 */
@Converter(autoApply = true)
public class StoryStatusConverter implements AttributeConverter<StoryStatus, String> {

    @Override
    public String convertToDatabaseColumn(StoryStatus attribute) {
        return attribute != null ? attribute.name() : StoryStatus.PENDING.name();
    }

    @Override
    public StoryStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return StoryStatus.PENDING;
        }
        try {
            return StoryStatus.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return StoryStatus.PENDING;
        }
    }
}
