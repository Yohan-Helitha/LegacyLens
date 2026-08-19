package lk.ac.sliit.legacylens.auth.repository;

import lk.ac.sliit.legacylens.auth.entity.OtpPurpose;
import lk.ac.sliit.legacylens.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {

    /** The most recent still pending OTP for a phone number + purpose. */
    Optional<OtpVerification> findFirstByPhoneNumberAndPurposeAndConsumedFalseOrderByCreatedAtDesc(
            String phoneNumber, OtpPurpose purpose);

    /** Wipes any older pending OTPs before a new one is issued. */
    void deleteByPhoneNumberAndPurposeAndConsumedFalse(String phoneNumber, OtpPurpose purpose);
}
