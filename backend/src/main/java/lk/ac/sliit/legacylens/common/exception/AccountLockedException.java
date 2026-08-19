package lk.ac.sliit.legacylens.common.exception;

public class AccountLockedException extends RuntimeException {

    public AccountLockedException(String message) {
        super(message);
    }
}
