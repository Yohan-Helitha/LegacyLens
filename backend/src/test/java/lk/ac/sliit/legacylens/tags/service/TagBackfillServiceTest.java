package lk.ac.sliit.legacylens.tags.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class TagBackfillServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private TagNormalizationService tagNormalizationService;

    @InjectMocks
    private TagBackfillService service;

    @Test
    @DisplayName("Backfill Parser: Correctly handles PostgreSQL array literal format {tag1,tag2}")
    void testParseRawTags_PostgresArray() {
        List<String> tags = service.parseRawTags("{crafts,masks,heritage}");
        assertThat(tags).containsExactly("crafts", "masks", "heritage");
    }

    @Test
    @DisplayName("Backfill Parser: Correctly handles quoted PostgreSQL array literal format {\"kandyan dance\",\"drums\"}")
    void testParseRawTags_QuotedPostgresArray() {
        List<String> tags = service.parseRawTags("{\"kandyan dance\",\"drums\"}");
        assertThat(tags).containsExactly("kandyan dance", "drums");
    }

    @Test
    @DisplayName("Backfill Parser: Correctly handles JSON array format [\"tag1\", \"tag2\"]")
    void testParseRawTags_JsonArray() {
        List<String> tags = service.parseRawTags("[\"dance\", \"kandyan\", \"art\"]");
        assertThat(tags).containsExactly("dance", "kandyan", "art");
    }

    @Test
    @DisplayName("Backfill Parser: Correctly handles comma-separated string")
    void testParseRawTags_CommaSeparated() {
        List<String> tags = service.parseRawTags("food, ambulla, cooking, recipe");
        assertThat(tags).containsExactly("food", "ambulla", "cooking", "recipe");
    }

    @Test
    @DisplayName("Backfill Parser: Correctly returns empty list for empty/null/{}/blank inputs")
    void testParseRawTags_EmptyInputs() {
        assertThat(service.parseRawTags(null)).isEmpty();
        assertThat(service.parseRawTags("")).isEmpty();
        assertThat(service.parseRawTags("{}")).isEmpty();
        assertThat(service.parseRawTags("   ")).isEmpty();
    }
}

