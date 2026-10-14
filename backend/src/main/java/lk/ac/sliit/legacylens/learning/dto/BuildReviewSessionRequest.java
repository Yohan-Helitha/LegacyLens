package lk.ac.sliit.legacylens.learning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class BuildReviewSessionRequest {

	@Min(1)
	@Max(15)
	private Integer limit = 5;

	public BuildReviewSessionRequest() {
	}

	public BuildReviewSessionRequest(Integer limit) {
		this.limit = limit;
	}

	public Integer getLimit() {
		return limit;
	}

	public void setLimit(Integer limit) {
		this.limit = limit;
	}
}
