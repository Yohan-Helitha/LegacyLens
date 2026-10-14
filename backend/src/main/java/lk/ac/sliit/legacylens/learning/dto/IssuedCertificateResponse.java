package lk.ac.sliit.legacylens.learning.dto;

public class IssuedCertificateResponse {

	private Long id;
	private Long trackId;
	private String trackTitle;
	private String learnerName;
	private String verificationCode;
	private String certificateType;
	private String issueDate;
	private String verifyUrl;

	public IssuedCertificateResponse() {
	}

	public IssuedCertificateResponse(
			Long id,
			Long trackId,
			String trackTitle,
			String learnerName,
			String verificationCode,
			String certificateType,
			String issueDate,
			String verifyUrl) {
		this.id = id;
		this.trackId = trackId;
		this.trackTitle = trackTitle;
		this.learnerName = learnerName;
		this.verificationCode = verificationCode;
		this.certificateType = certificateType;
		this.issueDate = issueDate;
		this.verifyUrl = verifyUrl;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getTrackId() {
		return trackId;
	}

	public void setTrackId(Long trackId) {
		this.trackId = trackId;
	}

	public String getTrackTitle() {
		return trackTitle;
	}

	public void setTrackTitle(String trackTitle) {
		this.trackTitle = trackTitle;
	}

	public String getLearnerName() {
		return learnerName;
	}

	public void setLearnerName(String learnerName) {
		this.learnerName = learnerName;
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

	public String getIssueDate() {
		return issueDate;
	}

	public void setIssueDate(String issueDate) {
		this.issueDate = issueDate;
	}

	public String getVerifyUrl() {
		return verifyUrl;
	}

	public void setVerifyUrl(String verifyUrl) {
		this.verifyUrl = verifyUrl;
	}
}
