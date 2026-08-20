package lk.ac.sliit.legacylens.common.exception;

/** Thrown when the configured SmsProvider fails to actually deliver an OTP. */
public class SmsDeliveryException extends RuntimeException {

    public SmsDeliveryException(String message) {
        super(message);
    }
}
