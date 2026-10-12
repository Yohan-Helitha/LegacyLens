package lk.ac.sliit.legacylens.learning.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPublishTrackRequest {

	@NotNull
	@Valid
	private AdminGeneratedTrackPreviewDto preview;
}
