package lk.ac.sliit.legacylens.stories.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lk.ac.sliit.legacylens.stories.entity.MediaType;

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

