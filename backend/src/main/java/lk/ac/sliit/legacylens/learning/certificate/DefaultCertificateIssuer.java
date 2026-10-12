package lk.ac.sliit.legacylens.learning.certificate;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.learning.dto.CertificateVerificationResponse;
import lk.ac.sliit.legacylens.learning.dto.IssuedCertificateResponse;
import lk.ac.sliit.legacylens.learning.entity.IssuedCertificate;
import lk.ac.sliit.legacylens.learning.entity.LearningTrack;
import lk.ac.sliit.legacylens.learning.repository.IssuedCertificateRepository;
import lk.ac.sliit.legacylens.learning.repository.LearningTrackRepository;
import lk.ac.sliit.legacylens.learning.repository.LessonProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DefaultCertificateIssuer implements CertificateIssuer {

	private static final Logger log = LoggerFactory.getLogger(DefaultCertificateIssuer.class);

	private final IssuedCertificateRepository issuedCertificateRepository;
	private final LearningTrackRepository learningTrackRepository;
	private final LessonProgressRepository lessonProgressRepository;
	private final VerificationCodeGenerator verificationCodeGenerator;
	private final Clock clock;
	private final ZoneId zoneId;

	public DefaultCertificateIssuer(
			IssuedCertificateRepository issuedCertificateRepository,
			LearningTrackRepository learningTrackRepository,
			LessonProgressRepository lessonProgressRepository,
			VerificationCodeGenerator verificationCodeGenerator,
			Clock clock,
			@Value("${app.learning.timezone:Asia/Colombo}") String timezone) {
		this.issuedCertificateRepository = issuedCertificateRepository;
		this.learningTrackRepository = learningTrackRepository;
		this.lessonProgressRepository = lessonProgressRepository;
		this.verificationCodeGenerator = verificationCodeGenerator;
		this.clock = clock;
		this.zoneId = ZoneId.of(timezone);
	}

	@Override
	@Transactional
	public IssuedCertificateResponse issueCertificate(UUID userId, String learnerName, Long trackId) {
		Optional<IssuedCertificate> existingOpt = issuedCertificateRepository.findByUserIdAndTrackId(userId, trackId);
		LearningTrack track = null;
		int totalLessons = 0;
		long completedLessons = 0;
		String certType = "ADMIN_TRACK";
		String snapshotName = "";
		LocalDateTime now = null;
		String code = "";
		IssuedCertificate cert = null;
		IssuedCertificate savedCert = null;

		if (existingOpt.isPresent()) {
			return mapToResponse(existingOpt.get());
		}

		track = learningTrackRepository.findById(trackId)
				.orElseThrow(() -> new ResourceNotFoundException("Track not found"));

		totalLessons = track.getTotalLessons() == null ? 0 : track.getTotalLessons();
		completedLessons = lessonProgressRepository
				.countByUserIdAndLesson_Track_IdAndCompletedTrue(userId, trackId);

		if (totalLessons == 0 || completedLessons < totalLessons) {
			throw new IllegalArgumentException("Track is not completed yet");
		}

		certType = "AI".equalsIgnoreCase(track.getOrigin()) ? "AI_COURSE" : "ADMIN_TRACK";
		snapshotName = (learnerName != null && !learnerName.isBlank()) ? learnerName.trim() : "Community Learner";
		now = LocalDateTime.now(clock.withZone(zoneId));
		code = verificationCodeGenerator.generateCode();

		cert = new IssuedCertificate();
		cert.setUserId(userId);
		cert.setTrackId(trackId);
		cert.setLearnerNameSnapshot(snapshotName);
		cert.setTrackTitleSnapshot(track.getTitle());
		cert.setVerificationCode(code);
		cert.setCertificateType(certType);
		cert.setIssuedAt(now);

		try {
			savedCert = issuedCertificateRepository.save(cert);
		} catch (DataIntegrityViolationException ex) {
			log.info("Concurrent certificate issue detected for user {} track {}", userId, trackId);
			savedCert = issuedCertificateRepository.findByUserIdAndTrackId(userId, trackId)
					.orElseThrow(() -> ex);
		}

		return mapToResponse(savedCert);
	}

	@Override
	public List<IssuedCertificateResponse> getMyCertificates(UUID userId) {
		List<IssuedCertificate> list = issuedCertificateRepository.findByUserIdOrderByIssuedAtDesc(userId);
		List<IssuedCertificateResponse> responses = new ArrayList<>();

		for (IssuedCertificate cert : list) {
			responses.add(mapToResponse(cert));
		}

		return responses;
	}

	@Override
	public CertificateVerificationResponse verifyCertificate(String verificationCode) {
		if (verificationCode == null || verificationCode.isBlank()) {
			return CertificateVerificationResponse.invalid("");
		}

		Optional<IssuedCertificate> certOpt = issuedCertificateRepository.findByVerificationCode(verificationCode.trim());
		if (certOpt.isEmpty()) {
			return CertificateVerificationResponse.invalid(verificationCode);
		}

		IssuedCertificate cert = certOpt.get();
		String formattedDate = cert.getIssuedAt()
				.toLocalDate()
				.format(DateTimeFormatter.ofPattern("d MMMM yyyy"));

		CertificateVerificationResponse response = new CertificateVerificationResponse(
				true,
				cert.getLearnerNameSnapshot(),
				cert.getTrackTitleSnapshot(),
				cert.getCertificateType(),
				formattedDate,
				cert.getVerificationCode()
		);

		return response;
	}

	private IssuedCertificateResponse mapToResponse(IssuedCertificate cert) {
		String formattedDate = cert.getIssuedAt()
				.toLocalDate()
				.format(DateTimeFormatter.ofPattern("d MMMM yyyy"));
		String verifyUrl = "/api/learning/certificates/verify/" + cert.getVerificationCode();

		IssuedCertificateResponse response = new IssuedCertificateResponse(
				cert.getId(),
				cert.getTrackId(),
				cert.getTrackTitleSnapshot(),
				cert.getLearnerNameSnapshot(),
				cert.getVerificationCode(),
				cert.getCertificateType(),
				formattedDate,
				verifyUrl
		);

		return response;
	}
}
