package lk.ac.sliit.legacylens.contentcapture.repository;

import lk.ac.sliit.legacylens.stories.entity.Story;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

/**
 * Composable filter predicates for "My Stories" (StoryQueryService) — kept
 * as small, independent Specifications rather than one ad-hoc repository
 * query per filter combination, so a new filter later is a new method here,
 * not a new repository method (Open/Closed).
 */
public final class StorySpecifications {

    private StorySpecifications() {
    }

    public static Specification<Story> ownedBy(UUID authorId) {
        return (root, query, cb) -> cb.equal(root.get("author").get("id"), authorId);
    }

    /** Null (no predicate) when statusFilter is null, matching every status. */
    public static Specification<Story> hasStatus(StoryStatus statusFilter) {
        return (root, query, cb) -> statusFilter == null ? null : cb.equal(root.get("status"), statusFilter);
    }

    /** Null (no predicate) when searchTerm is null/blank. Case-insensitive substring match on title. */
    public static Specification<Story> titleContains(String searchTerm) {
        return (root, query, cb) -> {
            if (searchTerm == null || searchTerm.isBlank()) {
                return null;
            }
            return cb.like(cb.lower(root.get("title")), "%" + searchTerm.toLowerCase() + "%");
        };
    }
}
