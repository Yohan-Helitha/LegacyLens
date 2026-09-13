package lk.ac.sliit.legacylens.users.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * The two "Become a Storyteller" intake questions, answered before the OTP
 * confirmation step. Mirrors StorytellerPreferences from the mobile app's
 * ContentPreferencesScreen — keys are passed through as-is (e.g. "video",
 * "village-dialects") rather than re-validated against a closed enum, since
 * the option list lives in the client and may grow independently.
 */
@Data
public class StorytellerPreferencesRequest {

    @NotEmpty(message = "Select at least one content type")
    private List<String> contentTypes;

    @NotEmpty(message = "Select at least one topic")
    private List<String> topics;

    private String otherTopic;
}
