package lk.ac.sliit.legacylens.learning.certificate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SecureVerificationCodeGeneratorTest {

	@Test
	@DisplayName("Generates unique codes starting with prefix LL-CERT-")
	void testGenerateCode() {
		SecureVerificationCodeGenerator generator = new SecureVerificationCodeGenerator();
		String code1 = generator.generateCode();
		String code2 = generator.generateCode();

		assertNotNull(code1);
		assertNotNull(code2);
		assertTrue(code1.startsWith("LL-CERT-"));
		assertTrue(code2.startsWith("LL-CERT-"));
		assertNotEquals(code1, code2);
	}
}
