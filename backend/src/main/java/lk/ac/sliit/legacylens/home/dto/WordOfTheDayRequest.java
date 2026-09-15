package lk.ac.sliit.legacylens.home.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/** Request body for creating or updating a Word of the Day entry. */
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

    @Size(max = 50)
    private String partOfSpeech;

    @Size(max = 255)
    private String audioFilename;

    @NotNull(message = "activeDate is required")
    private LocalDate activeDate;

    /** Draft | Scheduled | Published */
    @Size(max = 20)
    private String status;

    @Size(max = 20)
    private String language;
}
