package lk.ac.sliit.legacylens.speech.service;

import lk.ac.sliit.legacylens.speech.dto.AudioInput;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionOptions;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResult;
import lk.ac.sliit.legacylens.speech.provider.SpeechToTextProvider;

/**
 * Test double proving TranscriptionService works with no Azure class on the
 * classpath at all — the whole point of depending on the interface.
 */
class FakeSpeechProvider implements SpeechToTextProvider {

    private final String name;
    private TranscriptionResult nextResult;
    private AudioInput lastAudio;
    private TranscriptionOptions lastOptions;

    FakeSpeechProvider(String name) {
        this.name = name;
    }

    void willReturn(TranscriptionResult result) {
        this.nextResult = result;
    }

    AudioInput getLastAudio() {
        return lastAudio;
    }

    TranscriptionOptions getLastOptions() {
        return lastOptions;
    }

    @Override
    public String getProviderName() {
        return name;
    }

    @Override
    public TranscriptionResult transcribe(AudioInput audio, TranscriptionOptions options) {
        this.lastAudio = audio;
        this.lastOptions = options;

        return nextResult;
    }
}
