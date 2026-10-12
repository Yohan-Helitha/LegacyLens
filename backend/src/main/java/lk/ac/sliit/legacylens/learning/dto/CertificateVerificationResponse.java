package lk.ac.sliit.legacylens.learning.dto;

public class CertificateVerificationResponse {

	private boolean valid;
	private String learnerDisplayName;
	private String trackTitle;
	private String certificateType;
	private String issueDate;
	private String verificationCode;

	public CertificateVerificationResponse() {
	}

	public CertificateVerificationResponse(
			boolean valid,
			String learnerDisplayName,
			String trackTitle,
			String certificateType,
			String issueDate,
			String verificationCode) {
		this.valid = valid;
		this.learnerDisplayName = learnerDisplayName;
		this.trackTitle = trackTitle;
		this.certificateType = certificateType;
		this.issueDate = issueDate;
		this.verificationCode = verificationCode;
	}

	public static CertificateVerificationResponse invalid(String code) {
		return new CertificateVerificationResponse(false, null, null, null, null, code);
	}

	public boolean isValid() {
		return valid;
	}

	public void setValid(boolean valid) {
		this.valid = valid;
	}

	public String getLearnerDisplayName() {
		return learnerDisplayName;
	}

	public void setLearnerDisplayName(String learnerDisplayName) {
		this.learnerDisplayName = learnerDisplayName;
	}

	public String getTrackTitle() {
		return trackTitle;
	}

	public void setTrackTitle(String trackTitle) {
		this.trackTitle = trackTitle;
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

	public String getVerificationCode() {
		return verificationCode;
	}

	public void setVerificationCode(String verificationCode) {
		this.verificationCode = verificationCode;
	}
}
