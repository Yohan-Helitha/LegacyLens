package lk.ac.sliit.legacylens.moderation.integration;

import lk.ac.sliit.legacylens.marketplace.service.CreatorWorkPublisher;
import lk.ac.sliit.legacylens.marketplace.service.PublishedWork;
import lk.ac.sliit.legacylens.moderation.entity.ModerationQueueItem;
import lk.ac.sliit.legacylens.moderation.repository.ModerationQueueRepository;
import lk.ac.sliit.legacylens.stories.entity.StoryStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Where approved creator work becomes visible to users. The home feed is built from published rows of the
 * shared stories table, so publishing creator work writes one - already PUBLISHED, because both the knowledge
 * holder and an admin have approved it - with the creator as its author. (Stories that elders record are
 * different: they still go through the moderation queue.)
 */
@Component
public class StoryFeedWorkPublisher implements CreatorWorkPublisher {

    /** The shared stories table's own limits: stories.title is 200, the url columns 500. */
    private static final int TITLE_MAX = 200;
    private static final int URL_MAX = 500;

    private final ModerationQueueRepository moderationQueueRepository;

    public StoryFeedWorkPublisher(ModerationQueueRepository moderationQueueRepository) {
        this.moderationQueueRepository = moderationQueueRepository;
    }

    @Override
    public UUID publish(PublishedWork work) {
        ModerationQueueItem item = new ModerationQueueItem();
        item.setTitle(truncate(work.title(), TITLE_MAX));
        item.setDescription(work.description());
        item.setBodyContent(work.body());
        item.setType(work.type());
        // The creator wrote or attached it - it was not recorded live in the app.
        item.setMethod("BLOG".equals(work.type()) ? "WRITTEN" : "UPLOADED");
        item.setAuthorId(work.creatorId());
        item.setAuthorUserId(work.creatorId());
        item.setImageUrl(fits(work.imageUrl()));
        item.setMediaFilePath(fits(work.mediaUrl()));
        item.setMediaMimeType(work.mediaMimeType());
        item.setTags(work.keywords().toArray(new String[0]));
        item.setStatus(StoryStatus.PUBLISHED);
        item.setPublishedAt(LocalDateTime.now());
        return moderationQueueRepository.save(item).getId();
    }

    private static String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max);
    }

    /** A link longer than its column would fail the whole save; leaving it out keeps the rest of the work publishable. */
    private static String fits(String url) {
        return url != null && url.length() <= URL_MAX ? url : null;
    }
}
