package lk.ac.sliit.legacylens.learning.ai.source;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SourceSearchCriteria {

	private String query;
	private String region;
	private String occupation;
	private int page;
	private int size;
}
