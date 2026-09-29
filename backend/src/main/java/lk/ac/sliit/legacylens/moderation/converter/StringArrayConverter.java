package lk.ac.sliit.legacylens.moderation.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class StringArrayConverter implements AttributeConverter<String[], String> {

    @Override
    public String convertToDatabaseColumn(String[] attribute) {
        if (attribute == null || attribute.length == 0) {
            return "{}";
        }
        return "{" + String.join(",", attribute) + "}";
    }

    @Override
    public String[] convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new String[0];
        }
        String str = dbData.trim();
        if (str.startsWith("{") && str.endsWith("}")) {
            str = str.substring(1, str.length() - 1);
        }
        if (str.isBlank()) {
            return new String[0];
        }
        return str.split("\\s*,\\s*");
    }
}
