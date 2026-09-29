package lk.ac.sliit.legacylens.stories.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;

/**
 * autoApply means this covers every StoryStatus-typed field in the
 * persistence unit — both Story.status (elder-facing) and
 * ModerationQueueItem.status (admin-facing moderation package), which both
 * map the same `stories` table and now share this one enum (see
 * StoryStatus's own doc comment for that history). Without this converter,
 * Hibernate's default EnumType.STRING mapping throws on any status value
 * StoryStatus doesn't define, which fails the *entire* query for whichever
 * row it hits, not just that one row — falling back to PENDING here is
 * deliberately defensive, not just a formality.
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
