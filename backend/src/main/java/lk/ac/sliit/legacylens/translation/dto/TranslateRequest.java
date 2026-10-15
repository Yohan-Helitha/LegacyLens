package lk.ac.sliit.legacylens.translation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslateRequest {

    @NotEmpty(message = "texts must not be empty")
    private List<String> texts;

    /** Target language code: en, si or ta. */
    @NotBlank(message = "target is required")
    private String target;
}
