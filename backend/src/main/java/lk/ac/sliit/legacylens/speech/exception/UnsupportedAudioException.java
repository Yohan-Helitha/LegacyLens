package lk.ac.sliit.legacylens.speech.exception;

/** Thrown by AudioValidator — the upload itself is unusable (empty, too large, or wrong type). */
public class UnsupportedAudioException extends RuntimeException {

    public UnsupportedAudioException(String message) {
        super(message);
    }
}
