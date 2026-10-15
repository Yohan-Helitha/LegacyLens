package lk.ac.sliit.legacylens.home.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayRequest;
import lk.ac.sliit.legacylens.home.dto.WordOfTheDayResponse;
import lk.ac.sliit.legacylens.home.service.WordOfTheDayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class WordOfTheDayControllerTest {

    private MockMvc mockMvc;

    @Mock
    private WordOfTheDayService wordOfTheDayService;

    @InjectMocks
    private WordOfTheDayController wordOfTheDayController;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(wordOfTheDayController).build();
    }

    @Test
    void getWordOfToday_returnsTodayWord() throws Exception {
        LocalDate today = LocalDate.now();
        WordOfTheDayResponse response = WordOfTheDayResponse.builder()
                .id(1L)
                .word("ගොවියා")
                .transliteration("Goviya")
                .definition("Custodian of the soil")
                .partOfSpeech("Noun")
                .activeDate(today)
                .build();

        when(wordOfTheDayService.getWordOfToday()).thenReturn(response);

        mockMvc.perform(get("/api/home/word-of-the-day/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.word", is("ගොවියා")))
                .andExpect(jsonPath("$.data.transliteration", is("Goviya")));
    }

    @Test
    void createWord_validRequest_returnsOk() throws Exception {
        LocalDate date = LocalDate.now();
        WordOfTheDayRequest request = new WordOfTheDayRequest();
        request.setWord("කැකුළ");
        request.setTransliteration("Kekula");
        request.setDefinition("Bud");
        request.setPartOfSpeech("Noun");
        request.setActiveDate(date);

        WordOfTheDayResponse response = WordOfTheDayResponse.builder()
                .id(2L)
                .word("කැකුළ")
                .transliteration("Kekula")
                .definition("Bud")
                .activeDate(date)
                .build();

        when(wordOfTheDayService.createWord(any(WordOfTheDayRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/home/word-of-the-day")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(2)))
                .andExpect(jsonPath("$.data.word", is("කැකුළ")));
    }
}

