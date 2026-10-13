package lk.ac.sliit.legacylens.tags.config;

import lk.ac.sliit.legacylens.tags.service.TagBackfillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class TagDataInitializer implements CommandLineRunner {

    private final TagBackfillService tagBackfillService;

    @Override
    public void run(String... args) {
        try {
            tagBackfillService.backfillLegacyTags();
        } catch (Exception e) {
            log.warn("[TagDataInitializer] Notice during tag data initialization: {}", e.getMessage());
        }
    }
}

