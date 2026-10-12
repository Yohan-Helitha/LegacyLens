package lk.ac.sliit.legacylens.learning.ai.provider;

public interface AiContentGenerator {

	String getProviderName();

	GeneratedContentResult generate(GenerationPrompt prompt);
}
