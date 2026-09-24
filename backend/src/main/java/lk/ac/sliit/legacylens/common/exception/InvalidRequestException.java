package lk.ac.sliit.legacylens.common.exception;

/** A request that's individually well-formed but violates a cross-field business rule. */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
