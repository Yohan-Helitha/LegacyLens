package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayResponse;
import lk.ac.sliit.legacylens.home.entity.WordOfTheDay;
import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.home.repository.WordOfTheDayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class WordOfTheDayService {

    private final WordOfTheDayRepository repository;

    @PostConstruct
    public void seedData() {
        if (repository.count() == 0) {
            WordOfTheDay sample = new WordOfTheDay();
            sample.setWord("ගොවියා");
            sample.setTransliteration("Goviya (Farmer)");
            sample.setDefinition("Historically meant \"Protector of the Earth\" before modern agricultural connotations.");
            sample.setActiveDate(LocalDate.now());
            repository.save(sample);
        }
    }

    @Transactional(readOnly = true)
    public WordOfTheDayResponse getWordOfToday() {
        LocalDate today = LocalDate.now();
        return repository.findByActiveDate(today)
                .map(this::mapToResponse)
                .orElseGet(() -> repository.findFirstByOrderByActiveDateDesc()
                        .map(this::mapToResponse)
                        .orElseThrow(() -> new ResourceNotFoundException("No Word of the Day found")));
    }

    @Transactional
    public WordOfTheDayResponse createWord(WordOfTheDayRequest request) {
        WordOfTheDay word = repository.findByActiveDate(request.getActiveDate()).orElse(new WordOfTheDay());
        word.setWord(request.getWord());
        word.setTransliteration(request.getTransliteration());
        word.setDefinition(request.getDefinition());
        word.setCulturalNote(request.getCulturalNote());
        word.setActiveDate(request.getActiveDate());

        WordOfTheDay saved = repository.save(word);
        return mapToResponse(saved);
    }

    private WordOfTheDayResponse mapToResponse(WordOfTheDay word) {
        return WordOfTheDayResponse.builder()
                .id(word.getId())
                .word(word.getWord())
                .transliteration(word.getTransliteration())
                .definition(word.getDefinition())
                .culturalNote(word.getCulturalNote())
                .activeDate(word.getActiveDate())
                .build();
    }
}
