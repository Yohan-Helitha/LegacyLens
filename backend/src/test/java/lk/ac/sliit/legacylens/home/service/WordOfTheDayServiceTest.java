package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.common.exception.ResourceNotFoundException;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayResponse;
import lk.ac.sliit.legacylens.home.entity.WordOfTheDay;
import lk.ac.sliit.legacylens.home.repository.WordOfTheDayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WordOfTheDayServiceTest {

    @Mock
    private WordOfTheDayRepository repository;

    private WordOfTheDayService service;

    @BeforeEach
    void setUp() {
        service = new WordOfTheDayService(repository);
    }

    @Test
    void getWordOfToday_whenExplicitWordFound_returnsMappedWord() {
        LocalDate today = LocalDate.now();
        WordOfTheDay word = new WordOfTheDay();
        word.setId(1L);
        word.setWord("ගොවියා");
        word.setTransliteration("Goviya");
        word.setDefinition("The Custodian of Soil");
        word.setPartOfSpeech("Noun");
        word.setLanguage("Sinhala");
        word.setActiveDate(today);

        when(repository.findByActiveDate(today)).thenReturn(Optional.of(word));

        WordOfTheDayResponse response = service.getWordOfToday();

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getWord()).isEqualTo("ගොවියා");
        assertThat(response.getTransliteration()).isEqualTo("Goviya");
        assertThat(response.getDefinition()).isEqualTo("The Custodian of Soil");
        assertThat(response.getActiveDate()).isEqualTo(today);
    }

    @Test
    void getWordOfToday_whenNoExplicitWordForToday_rotatesDeterministically() {
        LocalDate today = LocalDate.now();
        when(repository.findByActiveDate(today)).thenReturn(Optional.empty());

        WordOfTheDay word1 = new WordOfTheDay();
        word1.setId(1L);
        word1.setWord("ගොවියා");

        WordOfTheDay word2 = new WordOfTheDay();
        word2.setId(2L);
        word2.setWord("සාමූහිකත්වය");

        when(repository.findAll(any(Sort.class))).thenReturn(List.of(word1, word2));

        WordOfTheDayResponse response = service.getWordOfToday();

        assertThat(response).isNotNull();
        assertThat(response.getWord()).isIn("ගොවියා", "සාමූහිකත්වය");
    }

    @Test
    void getWordOfToday_whenNoWordsInDatabase_throwsResourceNotFoundException() {
        LocalDate today = LocalDate.now();
        when(repository.findByActiveDate(today)).thenReturn(Optional.empty());
        when(repository.findAll(any(Sort.class))).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> service.getWordOfToday())
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("No Word of the Day found");
    }

    @Test
    void createWord_whenNoExistingEntryForDate_createsNewWord() {
        LocalDate targetDate = LocalDate.now().plusDays(1);
        WordOfTheDayRequest request = new WordOfTheDayRequest();
        request.setWord("කැකුළ");
        request.setTransliteration("Kekula");
        request.setDefinition("Tender unbloomed bud");
        request.setPartOfSpeech("Noun");
        request.setLanguage("Sinhala");
        request.setActiveDate(targetDate);

        when(repository.findByActiveDate(targetDate)).thenReturn(Optional.empty());

        WordOfTheDay saved = new WordOfTheDay();
        saved.setId(15L);
        saved.setWord("කැකුළ");
        saved.setTransliteration("Kekula");
        saved.setDefinition("Tender unbloomed bud");
        saved.setPartOfSpeech("Noun");
        saved.setLanguage("Sinhala");
        saved.setActiveDate(targetDate);

        when(repository.save(any(WordOfTheDay.class))).thenReturn(saved);

        WordOfTheDayResponse response = service.createWord(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(15L);
        assertThat(response.getWord()).isEqualTo("කැකුළ");
        assertThat(response.getActiveDate()).isEqualTo(targetDate);
        verify(repository).save(any(WordOfTheDay.class));
    }

    @Test
    void createWord_whenExistingWordForDate_updatesExistingWord() {
        LocalDate targetDate = LocalDate.now();
        WordOfTheDay existing = new WordOfTheDay();
        existing.setId(7L);
        existing.setWord("OldWord");
        existing.setActiveDate(targetDate);

        when(repository.findByActiveDate(targetDate)).thenReturn(Optional.of(existing));

        WordOfTheDayRequest request = new WordOfTheDayRequest();
        request.setWord("UpdatedWord");
        request.setTransliteration("Transliteration");
        request.setDefinition("New definition");
        request.setActiveDate(targetDate);

        when(repository.save(existing)).thenReturn(existing);

        WordOfTheDayResponse response = service.createWord(request);

        assertThat(response.getWord()).isEqualTo("UpdatedWord");
        assertThat(existing.getDefinition()).isEqualTo("New definition");
    }
}

