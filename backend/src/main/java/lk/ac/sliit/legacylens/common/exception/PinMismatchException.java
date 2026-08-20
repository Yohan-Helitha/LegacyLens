package lk.ac.sliit.legacylens.common.exception;

/** Thrown when newPin and confirmNewPin don't match during a PIN reset. */
public class PinMismatchException extends RuntimeException {

    public PinMismatchException(String message) {
        super(message);
    }
}
