package lk.ac.sliit.legacylens.home.controller;

import lk.ac.sliit.legacylens.home.dto.FeaturedKeeperResponse;
import lk.ac.sliit.legacylens.home.service.KnowledgeKeeperService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FeaturedKeeperControllerTest {

    private MockMvc mockMvc;

    @Mock
    private KnowledgeKeeperService knowledgeKeeperService;

    @InjectMocks
    private FeaturedKeeperController featuredKeeperController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(featuredKeeperController).build();
    }

    @Test
    void getFeaturedKeeper_returnsOkWithFeaturedKeeper() throws Exception {
        FeaturedKeeperResponse keeper = FeaturedKeeperResponse.builder()
                .id(1L)
                .name("Somalatha Jayasuriya")
                .title("Master Brass Artisan of Kandy")
                .tag("BRASS & METALWORK")
                .quote("The brass lamp illuminates.")
                .avatarUrl("https://example.com/avatar.jpg")
                .likesCount(200)
                .build();

        when(knowledgeKeeperService.getFeaturedKeeperOfToday()).thenReturn(keeper);

        mockMvc.perform(get("/api/home/featured-keeper"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.name", is("Somalatha Jayasuriya")))
                .andExpect(jsonPath("$.data.title", is("Master Brass Artisan of Kandy")));
    }
}

