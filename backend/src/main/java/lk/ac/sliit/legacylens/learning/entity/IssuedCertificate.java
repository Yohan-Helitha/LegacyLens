package lk.ac.sliit.legacylens.learning.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "issued_certificates", uniqueConstraints = {
		@UniqueConstraint(name = "uk_issued_certificates_user_track", columnNames = {"user_id", "track_id"}),
		@UniqueConstraint(name = "uk_issued_certificates_verification_code", columnNames = {"verification_code"})
})
public class IssuedCertificate {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private UUID userId;

	@Column(name = "track_id", nullable = false)
	private Long trackId;

	@Column(name = "learner_name_snapshot", nullable = false)
	private String learnerNameSnapshot;

	@Column(name = "track_title_snapshot", nullable = false)
	private String trackTitleSnapshot;

	@Column(name = "verification_code", nullable = false, unique = true, length = 64)
	private String verificationCode;

	@Column(name = "certificate_type", nullable = false, length = 50)
	private String certificateType = "ADMIN_TRACK";

	@Column(name = "issued_at", nullable = false)
	private LocalDateTime issuedAt;

	public IssuedCertificate() {
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public UUID getUserId() {
		return userId;
	}

	public void setUserId(UUID userId) {
		this.userId = userId;
	}

	public Long getTrackId() {
		return trackId;
	}

	public void setTrackId(Long trackId) {
		this.trackId = trackId;
	}

	public String getLearnerNameSnapshot() {
		return learnerNameSnapshot;
	}

	public void setLearnerNameSnapshot(String learnerNameSnapshot) {
		this.learnerNameSnapshot = learnerNameSnapshot;
	}

	public String getTrackTitleSnapshot() {
		return trackTitleSnapshot;
	}

	public void setTrackTitleSnapshot(String trackTitleSnapshot) {
		this.trackTitleSnapshot = trackTitleSnapshot;
	}

	public String getVerificationCode() {
		return verificationCode;
	}

	public void setVerificationCode(String verificationCode) {
		this.verificationCode = verificationCode;
	}

	public String getCertificateType() {
		return certificateType;
	}

	public void setCertificateType(String certificateType) {
		this.certificateType = certificateType;
	}

	public LocalDateTime getIssuedAt() {
		return issuedAt;
	}

	public void setIssuedAt(LocalDateTime issuedAt) {
		this.issuedAt = issuedAt;
	}
}
