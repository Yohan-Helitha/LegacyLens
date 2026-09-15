package lk.ac.sliit.legacylens.home.service;

import jakarta.annotation.PostConstruct;
import lk.ac.sliit.legacylens.home.dto.CategoryRequest;
import lk.ac.sliit.legacylens.home.dto.CategoryResponse;
import lk.ac.sliit.legacylens.home.entity.Category;
import lk.ac.sliit.legacylens.home.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;

    @PostConstruct
    public void seedCategories() {
        if (repository.count() == 0) {
            List<CategorySeed> initialCategories = List.of(
                    new CategorySeed("Traditional Food", "Recipes, cooking methods, food preservation", "Kiribath traditions, village sweets, traditional pickles"),
                    new CategorySeed("Farming & Agriculture", "Traditional farming knowledge and practices", "Paddy cultivation, traditional irrigation, seed preservation"),
                    new CategorySeed("Traditional Crafts", "Handmade crafts and techniques", "Dumbara weaving, pottery, reed weaving"),
                    new CategorySeed("Arts & Performing Arts", "Music, dance, theatre and folk performances", "Kandyan dance, folk songs, Kolam"),
                    new CategorySeed("Customs & Traditions", "Cultural practices and community traditions", "Avurudu customs, wedding traditions"),
                    new CategorySeed("Traditional Knowledge", "Indigenous knowledge passed through generations", "Herbal plants, traditional remedies, weather signs"),
                    new CategorySeed("Beliefs & Rituals", "Rituals, ceremonies and spiritual traditions", "Village rituals, blessings, ceremonial practices"),
                    new CategorySeed("Traditional Clothing", "Clothing, ornaments and dressing traditions", "Osariya, traditional jewellery"),
                    new CategorySeed("Traditional Life", "Everyday life and old ways of living", "Traditional houses, household practices"),
                    new CategorySeed("Language & Folklore", "Proverbs, idioms, folk stories and local expressions", "Sinhala proverbs, regional words"),
                    new CategorySeed("Folktales & Legends", "Stories, myths and legends", "Village legends, ancient folk stories"),
                    new CategorySeed("Folk Music & Songs", "Traditional songs, chants and musical practices", "Harvest songs, lullabies"),
                    new CategorySeed("Traditional Games & Sports", "Historical games and physical activities", "Elle, Olinda keliya, traditional games"),
                    new CategorySeed("Traditional Occupations", "Knowledge connected to historical occupations", "Blacksmithing, fishing, toddy tapping"),
                    new CategorySeed("Places & Heritage", "Important cultural places and local heritage", "Ancient villages, temples, historical sites"),
                    new CategorySeed("Nature & Environment", "Traditional relationships with nature", "Indigenous weather prediction, forest knowledge")
            );

            for (CategorySeed seed : initialCategories) {
                Category cat = new Category();
                cat.setName(seed.name);
                cat.setDescription(seed.description);
                cat.setExampleContent(seed.exampleContent);
                repository.save(cat);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return repository.findAllByOrderByNameAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = repository.findByNameIgnoreCase(request.getName())
                .orElseGet(() -> {
                    Category c = new Category();
                    c.setName(request.getName().trim());
                    return c;
                });

        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getExampleContent() != null) category.setExampleContent(request.getExampleContent());

        Category saved = repository.save(category);
        return mapToResponse(saved);
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .exampleContent(category.getExampleContent())
                .build();
    }

    private record CategorySeed(String name, String description, String exampleContent) {}
}
