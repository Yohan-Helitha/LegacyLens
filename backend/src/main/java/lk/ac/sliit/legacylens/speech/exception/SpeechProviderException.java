package lk.ac.sliit.legacylens.speech.exception;

/**
 * Thrown when the active provider itself fails (network error, exhausted
 * retry, or a non-2xx the provider doesn't otherwise map). The message is
 * always safe to show the caller — never the provider's raw response body,
 * which could echo request headers.
 */
public class SpeechProviderException extends RuntimeException {

    public SpeechProviderException(String message) {
        super(message);
    }

    public SpeechProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
