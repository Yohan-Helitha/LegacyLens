package lk.ac.sliit.legacylens.tags.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddAliasRequest {
    @NotBlank(message = "Alias is required")
    private String alias;
    private String languageCode;
    private String aliasType;
}

