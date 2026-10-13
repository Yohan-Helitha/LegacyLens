package lk.ac.sliit.legacylens.learning.ai.provider;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerationPrompt {

	private String systemInstruction;
	private String userPayload;
	private String expectedSchemaName;
	private Integer maxOutputTokens;
	private Integer timeoutSeconds;
}
