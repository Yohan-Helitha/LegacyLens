package lk.ac.sliit.legacylens.speech.controller;

import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.speech.dto.TranscriptionResponse;
import lk.ac.sliit.legacylens.speech.service.TranscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** HTTP mapping only — no transcription logic lives here, see TranscriptionService. */
@RestController
@RequestMapping("/api/speech")
public class SpeechController {

    private final TranscriptionService transcriptionService;

    public SpeechController(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    @PostMapping(value = "/transcribe", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<TranscriptionResponse>> transcribe(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(value = "language", required = false) String language) {

        TranscriptionResponse response = transcriptionService.transcribe(audio, language);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
