package lk.ac.sliit.legacylens.common.exception;

/** Thrown when an action isn't allowed given an application's current status — e.g. editing or submitting one that's no longer SAVED. */
public class InvalidApplicationStateException extends RuntimeException {

    public InvalidApplicationStateException(String message) {
        super(message);
    }
}
