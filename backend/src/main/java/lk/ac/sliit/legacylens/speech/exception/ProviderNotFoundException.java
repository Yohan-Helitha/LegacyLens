package lk.ac.sliit.legacylens.speech.exception;

/** Thrown when `app.speech.active-provider` doesn't match any registered SpeechToTextProvider bean. */
public class ProviderNotFoundException extends RuntimeException {

    public ProviderNotFoundException(String message) {
        super(message);
    }
}
