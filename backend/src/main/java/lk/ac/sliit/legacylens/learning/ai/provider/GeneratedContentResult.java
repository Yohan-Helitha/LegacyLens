package lk.ac.sliit.legacylens.learning.ai.provider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedContentResult {

	private String rawJson;
	private Integer inputTokens;
	private Integer outputTokens;
	private Long latencyMs;
	private String modelName;
}
