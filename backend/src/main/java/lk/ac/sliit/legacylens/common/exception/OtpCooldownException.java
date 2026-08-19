package lk.ac.sliit.legacylens.common.exception;

/** Thrown when the client asks for a resend before the cooldown window has passed. */
public class OtpCooldownException extends RuntimeException {

    public OtpCooldownException(String message) {
        super(message);
    }
}
