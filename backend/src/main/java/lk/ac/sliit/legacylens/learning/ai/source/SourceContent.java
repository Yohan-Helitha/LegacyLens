package lk.ac.sliit.legacylens.learning.ai.source;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SourceContent {

	private String id;
	private String title;
	private String text;
	private String region;
	private String occupation;
	private String language;
	private String audioUrl;
	private String contributorDisplayName;
}
