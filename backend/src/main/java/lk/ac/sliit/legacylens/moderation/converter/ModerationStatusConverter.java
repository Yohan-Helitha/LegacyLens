package lk.ac.sliit.legacylens.moderation.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lk.ac.sliit.legacylens.moderation.entity.ModerationStatus;

@Converter(autoApply = true)
public class ModerationStatusConverter implements AttributeConverter<ModerationStatus, String> {

    @Override
    public String convertToDatabaseColumn(ModerationStatus attribute) {
        return attribute != null ? attribute.name() : ModerationStatus.PENDING.name();
    }

    @Override
    public ModerationStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return ModerationStatus.PENDING;
        }
        try {
            return ModerationStatus.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ModerationStatus.PENDING;
        }
    }
}
