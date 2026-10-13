package lk.ac.sliit.legacylens.learning.ai.source;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SourceContentSummary {

	private String id;
	private String title;
	private String snippet;
	private String region;
	private String occupation;
	private String language;
	private String contributorDisplayName;
	private boolean hasAudio;
}
