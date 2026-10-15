package lk.ac.sliit.legacylens.tags.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UpdateTagRequest {
    private String canonicalName;
    private String description;
    private String languageCode;
    private String category;

    @JsonProperty("isApproved")
    private Boolean isApproved;

    @JsonProperty("approved")
    public void setApproved(Boolean approved) {
        if (this.isApproved == null) {
            this.isApproved = approved;
        }
    }
}
