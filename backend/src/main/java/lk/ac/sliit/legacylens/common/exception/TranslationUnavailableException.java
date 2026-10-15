package lk.ac.sliit.legacylens.common.exception;

/** The translation service isn't configured or couldn't be reached — the client should fall back to showing the original text. */
public class TranslationUnavailableException extends RuntimeException {

    public TranslationUnavailableException(String message) {
        super(message);
    }
}
