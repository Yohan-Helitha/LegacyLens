package lk.ac.sliit.legacylens.learning.ai.validation;

import lk.ac.sliit.legacylens.learning.ai.prompt.PromptOptions;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;

import java.util.List;

public interface GeneratedContentValidator {

	ValidationResult validate(String rawJson, List<SourceContent> sources, PromptOptions options);
}
