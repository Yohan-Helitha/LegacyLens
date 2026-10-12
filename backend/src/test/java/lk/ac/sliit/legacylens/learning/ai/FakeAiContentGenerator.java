package lk.ac.sliit.legacylens.learning.ai;

import lk.ac.sliit.legacylens.learning.ai.provider.AiContentGenerator;
import lk.ac.sliit.legacylens.learning.ai.provider.GeneratedContentResult;
import lk.ac.sliit.legacylens.learning.ai.provider.GenerationPrompt;

public class FakeAiContentGenerator implements AiContentGenerator {

	private GeneratedContentResult cannedResult;
	private RuntimeException cannedException;
	private int callCount = 0;

	public FakeAiContentGenerator() {
	}

	public FakeAiContentGenerator(GeneratedContentResult cannedResult) {
		this.cannedResult = cannedResult;
	}

	public void setCannedResult(GeneratedContentResult cannedResult) {
		this.cannedResult = cannedResult;
		this.cannedException = null;
	}

	public void setCannedException(RuntimeException cannedException) {
		this.cannedException = cannedException;
	}

	public int getCallCount() {
		return callCount;
	}

	@Override
	public String getProviderName() {
		return "fake";
	}

	@Override
	public GeneratedContentResult generate(GenerationPrompt prompt) {
		callCount++;

		if (cannedException != null) {
			throw cannedException;
		}

		return cannedResult;
	}
}
