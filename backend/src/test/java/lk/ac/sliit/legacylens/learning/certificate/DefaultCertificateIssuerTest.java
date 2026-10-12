package lk.ac.sliit.legacylens.learning.certificate;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.CertificateVerificationResponse;
import lk.ac.sliit.legacylens.learning.dto.IssuedCertificateResponse;
import lk.ac.sliit.legacylens.learning.entity.IssuedCertificate;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.IssuedCertificateRepository;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DefaultCertificateIssuerTest {

	private IssuedCertificateRepository issuedCertificateRepository;
	private LearningTrackRepository learningTrackRepository;
	private LessonProgressRepository lessonProgressRepository;
	private VerificationCodeGenerator verificationCodeGenerator;
	private Clock fixedClock;
	private DefaultCertificateIssuer issuer;

	private final UUID userId = UUID.randomUUID();
	private final Long trackId = 100L;

	@BeforeEach
	void setUp() {
		issuedCertificateRepository = mock(IssuedCertificateRepository.class);
		learningTrackRepository = mock(LearningTrackRepository.class);
		lessonProgressRepository = mock(LessonProgressRepository.class);
		verificationCodeGenerator = mock(VerificationCodeGenerator.class);
		fixedClock = Clock.fixed(Instant.parse("2026-10-12T10:00:00Z"), ZoneId.of("Asia/Colombo"));

		issuer = new DefaultCertificateIssuer(
				issuedCertificateRepository,
				learningTrackRepository,
				lessonProgressRepository,
				verificationCodeGenerator,
				fixedClock,
				"Asia/Colombo"
		);
	}

	@Test
	@DisplayName("Throws exception when attempting to issue certificate for an incomplete track")
	void testIssueIncompleteTrack() {
		LearningTrack track = new LearningTrack();
		track.setId(trackId);
		track.setTotalLessons(5);
		track.setOrigin("ADMIN");

		when(issuedCertificateRepository.findByUserIdAndTrackId(userId, trackId))
				.thenReturn(Optional.empty());
		when(learningTrackRepository.findById(trackId)).thenReturn(Optional.of(track));
		when(lessonProgressRepository.countByUserIdAndLesson_Track_IdAndCompletedTrue(userId, trackId))
				.thenReturn(3L);

		assertThrows(IllegalArgumentException.class, () ->
				issuer.issueCertificate(userId, "Nimal Perera", trackId)
		);
	}

	@Test
	@DisplayName("Successfully issues certificate when track is complete with unique verification code")
	void testIssueCompleteTrack() {
		LearningTrack track = new LearningTrack();
		track.setId(trackId);
		track.setTitle("Mask Carving Heritage");
		track.setTotalLessons(4);
		track.setOrigin("ADMIN");

		when(issuedCertificateRepository.findByUserIdAndTrackId(userId, trackId))
				.thenReturn(Optional.empty());
		when(learningTrackRepository.findById(trackId)).thenReturn(Optional.of(track));
		when(lessonProgressRepository.countByUserIdAndLesson_Track_IdAndCompletedTrue(userId, trackId))
				.thenReturn(4L);
		when(verificationCodeGenerator.generateCode()).thenReturn("LL-CERT-TEST1234-5678");
		when(issuedCertificateRepository.save(any(IssuedCertificate.class))).thenAnswer(inv -> {
			IssuedCertificate saved = inv.getArgument(0);
			saved.setId(1L);
			return saved;
		});

		IssuedCertificateResponse response = issuer.issueCertificate(userId, "Nimal Perera", trackId);

		assertNotNull(response);
		assertEquals("LL-CERT-TEST1234-5678", response.getVerificationCode());
		assertEquals("Mask Carving Heritage", response.getTrackTitle());
		assertEquals("Nimal Perera", response.getLearnerName());
		assertEquals("ADMIN_TRACK", response.getCertificateType());
		verify(issuedCertificateRepository).save(any(IssuedCertificate.class));
	}

	@Test
	@DisplayName("Certificate issuance is idempotent and returns already issued certificate")
	void testIssueIdempotent() {
		IssuedCertificate existing = new IssuedCertificate();
		existing.setId(1L);
		existing.setUserId(userId);
		existing.setTrackId(trackId);
		existing.setLearnerNameSnapshot("Nimal Perera");
		existing.setTrackTitleSnapshot("Mask Carving Heritage");
		existing.setVerificationCode("LL-CERT-ALREADY-ISSUED");
		existing.setCertificateType("ADMIN_TRACK");
		existing.setIssuedAt(LocalDateTime.now(fixedClock));

		when(issuedCertificateRepository.findByUserIdAndTrackId(userId, trackId))
				.thenReturn(Optional.of(existing));

		IssuedCertificateResponse response = issuer.issueCertificate(userId, "Nimal Perera", trackId);

		assertNotNull(response);
		assertEquals("LL-CERT-ALREADY-ISSUED", response.getVerificationCode());
		verify(issuedCertificateRepository, never()).save(any());
	}

	@Test
	@DisplayName("Public verification returns valid=true and minimal fields for existing code")
	void testVerifyValidCode() {
		IssuedCertificate cert = new IssuedCertificate();
		cert.setLearnerNameSnapshot("Kamal Gunaratne");
		cert.setTrackTitleSnapshot("Pottery Traditions of Kelaniya");
		cert.setVerificationCode("LL-CERT-VALID-CODE");
		cert.setCertificateType("ADMIN_TRACK");
		cert.setIssuedAt(LocalDateTime.now(fixedClock));

		when(issuedCertificateRepository.findByVerificationCode("LL-CERT-VALID-CODE"))
				.thenReturn(Optional.of(cert));

		CertificateVerificationResponse result = issuer.verifyCertificate("LL-CERT-VALID-CODE");

		assertTrue(result.isValid());
		assertEquals("Kamal Gunaratne", result.getLearnerDisplayName());
		assertEquals("Pottery Traditions of Kelaniya", result.getTrackTitle());
		assertEquals("ADMIN_TRACK", result.getCertificateType());
		assertEquals("LL-CERT-VALID-CODE", result.getVerificationCode());
	}

	@Test
	@DisplayName("Public verification returns valid=false for non-existent or blank code")
	void testVerifyInvalidCode() {
		when(issuedCertificateRepository.findByVerificationCode("UNKNOWN-CODE"))
				.thenReturn(Optional.empty());

		CertificateVerificationResponse result = issuer.verifyCertificate("UNKNOWN-CODE");

		assertFalse(result.isValid());
		assertNull(result.getLearnerDisplayName());
		assertNull(result.getTrackTitle());

		CertificateVerificationResponse blankResult = issuer.verifyCertificate("  ");
		assertFalse(blankResult.isValid());
	}
}
