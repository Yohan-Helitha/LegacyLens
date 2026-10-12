package lk.ac.sliit.legacylens.learning.service;

import lk.ac.sliit.legacylens.learning.progress.XpPolicy;
import org.springframework.stereotype.Service;

@Service
public class XpService {

	private final XpPolicy xpPolicy;

	public XpService(XpPolicy xpPolicy) {
		this.xpPolicy = xpPolicy;
	}

	public int calculateQuizXp(int correctAnswers, boolean completed) {
		int xp = xpPolicy.calculateQuizXp(correctAnswers, completed);

		return xp;
	}
}