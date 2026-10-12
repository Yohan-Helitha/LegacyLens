package lk.ac.sliit.legacylens.common.exception;

/** Thrown when a requested status change isn't a legal transition from the entity's current state. */
public class StateTransitionException extends RuntimeException {

    public StateTransitionException(String message) {
        super(message);
    }
}
