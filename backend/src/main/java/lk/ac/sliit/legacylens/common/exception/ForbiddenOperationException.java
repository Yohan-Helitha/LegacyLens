package lk.ac.sliit.legacylens.common.exception;

/** The caller is authenticated but not allowed to perform this specific action. */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
