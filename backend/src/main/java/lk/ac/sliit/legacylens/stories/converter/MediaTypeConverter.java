package lk.ac.sliit.legacylens.stories.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lk.ac.sliit.legacylens.stories.entity.MediaType;

/**
 * Reads stories.media_type leniently. That column is shared with the admin side (ModerationQueueItem maps it as
 * a free-text "type"), so it can hold values this enum doesn't define. With Hibernate's default enum mapping a
 * single such row throws and fails the *entire* query - e.g. one "BLOG" row broke every storyteller's My Stories
 * list. An unrecognised value is read as "no media clip" (null) instead. Same approach as StoryStatusConverter.
 *
 * Applied automatically to every MediaType-typed field (Story.mediaType must therefore not carry @Enumerated,
 * which would switch autoApply off for it).
 */
@Converter(autoApply = true)
public class MediaTypeConverter implements AttributeConverter<MediaType, String> {

    @Override
    public String convertToDatabaseColumn(MediaType attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public MediaType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return MediaType.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
