package lk.ac.sliit.legacylens.home.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/** DTO returned to the mobile client for the Word of the Day card. */
@Data
@Builder
public class WordOfTheDayResponse {
    private Long id;
    private String word;
    private String transliteration;
    private String definition;
    private String culturalNote;
    private LocalDate activeDate;
}
