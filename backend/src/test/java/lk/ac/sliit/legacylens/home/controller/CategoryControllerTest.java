package lk.ac.sliit.legacylens.home.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.ac.sliit.legacylens.home.dto.CategoryRequest;
import lk.ac.sliit.legacylens.home.dto.CategoryResponse;
import lk.ac.sliit.legacylens.home.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController categoryController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController).build();
    }

    @Test
    void getAllCategories_returnsSuccessResponseWithList() throws Exception {
        CategoryResponse cat1 = CategoryResponse.builder()
                .id(1L)
                .name("Traditional Food")
                .description("Recipes and preservation")
                .build();
        CategoryResponse cat2 = CategoryResponse.builder()
                .id(2L)
                .name("Traditional Crafts")
                .description("Handmade crafts")
                .build();

        when(categoryService.getAllCategories()).thenReturn(List.of(cat1, cat2));

        mockMvc.perform(get("/api/home/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].name", is("Traditional Food")))
                .andExpect(jsonPath("$.data[1].name", is("Traditional Crafts")));
    }

    @Test
    void createCategory_validRequest_returnsCreated() throws Exception {
        CategoryRequest request = new CategoryRequest();
        request.setName("Ancient Medicine");
        request.setDescription("Indigenous Ayurveda knowledge");

        CategoryResponse created = CategoryResponse.builder()
                .id(3L)
                .name("Ancient Medicine")
                .description("Indigenous Ayurveda knowledge")
                .build();

        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/home/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(3)))
                .andExpect(jsonPath("$.data.name", is("Ancient Medicine")));
    }
}

