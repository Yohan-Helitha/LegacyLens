package lk.ac.sliit.legacylens.home.controller;

import jakarta.validation.Valid;
import lk.ac.sliit.legacylens.common.dto.ApiResponse;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayResponse;
import lk.ac.sliit.legacylens.home.service.WordOfTheDayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/home/word-of-the-day")
@RequiredArgsConstructor
public class WordOfTheDayController {

    private final WordOfTheDayService service;

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<WordOfTheDayResponse>> getWordOfToday() {
        return ResponseEntity.ok(ApiResponse.ok(service.getWordOfToday()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WordOfTheDayResponse>> createWord(@Valid @RequestBody WordOfTheDayRequest request) {
        WordOfTheDayResponse response = service.createWord(request);
        return ResponseEntity.ok(ApiResponse.ok("Word of the day created/updated successfully", response));
    }
}
