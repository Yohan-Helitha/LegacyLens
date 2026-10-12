package lk.ac.sliit.legacylens.learning.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudySetSummaryResponse {

	private Long id;
	private String title;
	private String description;
	private String region;
	private String occupation;
	private Integer totalLessons;
	private String origin;
	private List<String> sourceContentIds;
	private LocalDate createdAt;
	private long attemptCount;
	private Integer bestScore;
}
