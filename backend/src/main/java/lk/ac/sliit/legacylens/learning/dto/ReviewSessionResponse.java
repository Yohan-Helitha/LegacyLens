package lk.ac.sliit.legacylens.learning.dto;

import java.util.List;

public class ReviewSessionResponse {

	private String sessionId;
	private int totalQuestions;
	private String strategyUsed;
	private List<ReviewQuestionDto> questions;

	public ReviewSessionResponse() {
	}

	public ReviewSessionResponse(
			String sessionId,
			int totalQuestions,
			String strategyUsed,
			List<ReviewQuestionDto> questions) {
		this.sessionId = sessionId;
		this.totalQuestions = totalQuestions;
		this.strategyUsed = strategyUsed;
		this.questions = questions;
	}

	public String getSessionId() {
		return sessionId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}

	public int getTotalQuestions() {
		return totalQuestions;
	}

	public void setTotalQuestions(int totalQuestions) {
		this.totalQuestions = totalQuestions;
	}

	public String getStrategyUsed() {
		return strategyUsed;
	}

	public void setStrategyUsed(String strategyUsed) {
		this.strategyUsed = strategyUsed;
	}

	public List<ReviewQuestionDto> getQuestions() {
		return questions;
	}

	public void setQuestions(List<ReviewQuestionDto> questions) {
		this.questions = questions;
	}
}
