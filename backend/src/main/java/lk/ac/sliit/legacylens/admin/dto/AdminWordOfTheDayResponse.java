package lk.ac.sliit.legacylens.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Admin-enriched response DTO for Word of the Day management.
 * Includes audit timestamps and the stored status field.
 */
@Data
@Builder
public class AdminWordOfTheDayResponse {
    private Long id;
    private String word;
    private String transliteration;
    private String definition;
    private String partOfSpeech;
    private String audioFilename;
    private LocalDate activeDate;
    private String status;          // Draft | Scheduled | Published | Today | Past
    private String language;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
