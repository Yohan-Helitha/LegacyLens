package lk.ac.sliit.legacylens.learning;

import lk.ac.sliit.legacylens.learning.controller.LearningTrackController;
import lk.ac.sliit.legacylens.learning.controller.LessonController;
import lk.ac.sliit.legacylens.learning.controller.LessonProgressController;
import lk.ac.sliit.legacylens.learning.dto.CertificateVerificationResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

class LearningAuthorizationTest {

	@Test
	@DisplayName("Admin learning track mutations require ROLE_ADMIN")
	void testTrackMutationsRequireAdmin() throws NoSuchMethodException {
		Method create = LearningTrackController.class.getMethod("createTrack", lk.ac.sliit.legacylens.learning.entity.LearningTrack.class);
		Method update = LearningTrackController.class.getMethod("updateTrack", Long.class, lk.ac.sliit.legacylens.learning.entity.LearningTrack.class);
		Method delete = LearningTrackController.class.getMethod("deleteTrack", Long.class);

		assertPreAuthorizeAdmin(create);
		assertPreAuthorizeAdmin(update);
		assertPreAuthorizeAdmin(delete);
	}

	@Test
	@DisplayName("Admin lesson mutations require ROLE_ADMIN")
	void testLessonMutationsRequireAdmin() throws NoSuchMethodException {
		Method create = LessonController.class.getMethod("createLesson", Long.class, lk.ac.sliit.legacylens.learning.entity.Lesson.class);
		Method update = LessonController.class.getMethod("updateLesson", Long.class, lk.ac.sliit.legacylens.learning.entity.Lesson.class);
		Method delete = LessonController.class.getMethod("deleteLesson", Long.class);

		assertPreAuthorizeAdmin(create);
		assertPreAuthorizeAdmin(update);
		assertPreAuthorizeAdmin(delete);
	}

	@Test
	@DisplayName("Reading another learner's administrative progress requires ROLE_ADMIN")
	void testAdminUserProgressRequiresAdmin() throws NoSuchMethodException {
		Method adminProgress = LessonProgressController.class.getMethod("getAdminUserProgress", java.util.UUID.class);
		assertPreAuthorizeAdmin(adminProgress);
	}

	@Test
	@DisplayName("Certificate verification response exposes only minimal public verification fields")
	void testPublicCertificateVerificationMinimalFields() {
		CertificateVerificationResponse resp = new CertificateVerificationResponse(
				true,
				"Sunil Perera",
				"Mask Heritage",
				"ADMIN_TRACK",
				"2026-10-12",
				"LL-CERT-TEST-1234"
		);

		// Ensure minimal public verification payload (no user ID, no private entity data)
		assertNotNull(resp.getVerificationCode());
		assertNotNull(resp.getLearnerDisplayName());
		assertNotNull(resp.getTrackTitle());
		assertNotNull(resp.getCertificateType());
		assertNotNull(resp.getIssueDate());
		assertTrue(resp.isValid());

		// Verify CertificateVerificationResponse does NOT contain internal userId fields
		boolean hasUserIdField = false;
		for (var field : CertificateVerificationResponse.class.getDeclaredFields()) {
			if ("userId".equalsIgnoreCase(field.getName()) || "ownerUserId".equalsIgnoreCase(field.getName())) {
				hasUserIdField = true;
				break;
			}
		}
		assertFalse(hasUserIdField, "CertificateVerificationResponse must not leak userId field");
	}

	private void assertPreAuthorizeAdmin(Method method) {
		PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
		assertNotNull(annotation, "Method " + method.getName() + " must have @PreAuthorize");
		assertTrue(annotation.value().contains("hasRole('ADMIN')"),
				"Method " + method.getName() + " must require hasRole('ADMIN'), found: " + annotation.value());
	}
}
