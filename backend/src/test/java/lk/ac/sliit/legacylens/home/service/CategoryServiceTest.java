package lk.ac.sliit.legacylens.home.service;

import lk.ac.sliit.legacylens.home.dto.CategoryRequest;
import lk.ac.sliit.legacylens.home.dto.CategoryResponse;
import lk.ac.sliit.legacylens.home.entity.Category;
import lk.ac.sliit.legacylens.home.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository repository;

    private CategoryService service;

    @BeforeEach
    void setUp() {
        service = new CategoryService(repository);
    }

    @Test
    void getAllCategories_returnsMappedCategoriesInOrder() {
        Category cat1 = new Category();
        cat1.setId(1L);
        cat1.setName("Traditional Crafts");
        cat1.setDescription("Handmade crafts and techniques");
        cat1.setExampleContent("Dumbara weaving, pottery");

        Category cat2 = new Category();
        cat2.setId(2L);
        cat2.setName("Traditional Food");
        cat2.setDescription("Recipes and cooking methods");
        cat2.setExampleContent("Kiribath, sweets");

        when(repository.findAllByOrderByNameAsc()).thenReturn(List.of(cat1, cat2));

        List<CategoryResponse> results = service.getAllCategories();

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo(1L);
        assertThat(results.get(0).getName()).isEqualTo("Traditional Crafts");
        assertThat(results.get(0).getDescription()).isEqualTo("Handmade crafts and techniques");
        assertThat(results.get(1).getId()).isEqualTo(2L);
        assertThat(results.get(1).getName()).isEqualTo("Traditional Food");
    }

    @Test
    void getAllCategories_whenEmpty_returnsEmptyList() {
        when(repository.findAllByOrderByNameAsc()).thenReturn(Collections.emptyList());

        List<CategoryResponse> results = service.getAllCategories();

        assertThat(results).isEmpty();
    }

    @Test
    void createCategory_whenNewCategory_savesAndReturnsResponse() {
        CategoryRequest request = new CategoryRequest();
        request.setName("Ancient Folklore");
        request.setDescription("Oral tales passed through generations");
        request.setExampleContent("Village myths");

        when(repository.findByNameIgnoreCase("Ancient Folklore")).thenReturn(Optional.empty());

        Category savedCategory = new Category();
        savedCategory.setId(10L);
        savedCategory.setName("Ancient Folklore");
        savedCategory.setDescription("Oral tales passed through generations");
        savedCategory.setExampleContent("Village myths");

        when(repository.save(any(Category.class))).thenReturn(savedCategory);

        CategoryResponse response = service.createCategory(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("Ancient Folklore");
        assertThat(response.getDescription()).isEqualTo("Oral tales passed through generations");

        ArgumentCaptor<Category> captor = ArgumentCaptor.forClass(Category.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Ancient Folklore");
    }

    @Test
    void createCategory_whenExistingCategory_updatesFieldsAndReturns() {
        Category existing = new Category();
        existing.setId(5L);
        existing.setName("Traditional Crafts");
        existing.setDescription("Old description");

        when(repository.findByNameIgnoreCase("Traditional Crafts")).thenReturn(Optional.of(existing));

        CategoryRequest request = new CategoryRequest();
        request.setName("Traditional Crafts");
        request.setDescription("Updated description");
        request.setExampleContent("Updated examples");

        when(repository.save(existing)).thenReturn(existing);

        CategoryResponse response = service.createCategory(request);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(existing.getDescription()).isEqualTo("Updated description");
        assertThat(existing.getExampleContent()).isEqualTo("Updated examples");
    }

    @Test
    void seedCategories_whenRepositoryEmpty_savesInitialCategories() {
        when(repository.count()).thenReturn(0L);

        service.seedCategories();

        verify(repository, atLeast(1)).save(any(Category.class));
    }

    @Test
    void seedCategories_whenRepositoryNotEmpty_doesNothing() {
        when(repository.count()).thenReturn(16L);

        service.seedCategories();

        verify(repository, never()).save(any(Category.class));
    }
}

