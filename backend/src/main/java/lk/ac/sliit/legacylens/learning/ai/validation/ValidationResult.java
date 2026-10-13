package lk.ac.sliit.legacylens.learning.ai.validation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationResult {

	private boolean valid;
	private String failureReason;
	private GeneratedStudySet studySet;
	private int droppedFlashcardsCount;
	private int droppedQuestionsCount;
}
