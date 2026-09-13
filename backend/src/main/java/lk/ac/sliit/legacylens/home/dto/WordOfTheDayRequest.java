package lk.ac.sliit.legacylens.home.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/** Request body for creating or updating a Word of the Day entry (admin only). */
@Data
public class WordOfTheDayRequest {

    @NotBlank(message = "word is required")
    @Size(max = 100)
    private String word;

    @NotBlank(message = "transliteration is required")
    @Size(max = 200)
    private String transliteration;

    @NotBlank(message = "definition is required")
    @Size(max = 500)
    private String definition;

    @Size(max = 1000)
    private String culturalNote;

    @NotNull(message = "activeDate is required")
    private LocalDate activeDate;
}
