package lk.ac.sliit.legacylens.common.exception;

/** A caller exceeded a per-user request limit — answered with HTTP 429. */
public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
