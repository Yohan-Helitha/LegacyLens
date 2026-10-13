package lk.ac.sliit.legacylens.learning.ai.prompt;

import lk.ac.sliit.legacylens.learning.ai.provider.GenerationPrompt;
import lk.ac.sliit.legacylens.learning.ai.source.SourceContent;

import java.util.List;

public interface PromptBuilder {

	GenerationPrompt buildPrompt(List<SourceContent> contents, PromptOptions options);
}
