package lk.ac.sliit.legacylens.marketplace.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/** A creator's new list of spoken languages - replaces the one on their application. */
@Data
public class UpdateLanguagesRequest {

    /** One "Language:LEVEL" entry per language, e.g. "Sinhala:FLUENT". */
    @NotEmpty(message = "Select at least one language")
    private List<String> languages;
}
