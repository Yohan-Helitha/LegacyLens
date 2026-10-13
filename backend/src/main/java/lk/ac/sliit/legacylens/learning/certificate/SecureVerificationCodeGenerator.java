package lk.ac.sliit.legacylens.learning.certificate;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
@ConditionalOnProperty(name = "app.learning.certificate.code-generator", havingValue = "secure", matchIfMissing = true)
public class SecureVerificationCodeGenerator implements VerificationCodeGenerator {

	private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private final SecureRandom random = new SecureRandom();

	@Override
	public String generateCode() {
		StringBuilder sb = new StringBuilder("LL-CERT-");
		int part1Length = 8;
		int part2Length = 8;

		for (int i = 0; i < part1Length; i++) {
			int idx = random.nextInt(ALPHANUM.length());
			sb.append(ALPHANUM.charAt(idx));
		}

		sb.append("-");

		for (int i = 0; i < part2Length; i++) {
			int idx = random.nextInt(ALPHANUM.length());
			sb.append(ALPHANUM.charAt(idx));
		}

		String code = sb.toString();

		return code;
	}
}
