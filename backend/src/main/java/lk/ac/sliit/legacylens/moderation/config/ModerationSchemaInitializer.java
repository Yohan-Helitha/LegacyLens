package lk.ac.sliit.legacylens.moderation.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ModerationSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            // 1. Ensure rejection_reason, rejection_notes, likes_count, comments_count
            // columns exist on stories
            try {
                jdbcTemplate.execute("ALTER TABLE stories ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(100)");
                jdbcTemplate.execute("ALTER TABLE stories ADD COLUMN IF NOT EXISTS rejection_notes TEXT");
                jdbcTemplate.execute("ALTER TABLE stories ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE stories ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0");
                jdbcTemplate.execute("ALTER TABLE feed_item_comments ADD COLUMN IF NOT EXISTS story_id UUID");
                jdbcTemplate.execute("ALTER TABLE feed_item_comments ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE feed_item_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP");
                jdbcTemplate.execute("ALTER TABLE feed_item_comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()");
                jdbcTemplate.execute("ALTER TABLE feed_item_comments ALTER COLUMN feed_item_id DROP NOT NULL");

                jdbcTemplate.execute("ALTER TABLE featured_keepers ADD COLUMN IF NOT EXISTS story_id VARCHAR(100)");
                jdbcTemplate.execute("ALTER TABLE featured_keepers ADD COLUMN IF NOT EXISTS story_title VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE featured_keepers ADD COLUMN IF NOT EXISTS active_date DATE");
                jdbcTemplate.execute("ALTER TABLE featured_keepers ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active'");
                jdbcTemplate.execute("ALTER TABLE featured_keepers ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN DEFAULT FALSE");
                jdbcTemplate.execute("ALTER TABLE featured_keepers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()");
                jdbcTemplate.execute("ALTER TABLE featured_keepers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()");

                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS story_quizzes (
                        id UUID PRIMARY KEY,
                        story_id UUID NOT NULL UNIQUE,
                        question TEXT NOT NULL,
                        explanation TEXT,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )
                """);

                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS story_quiz_options (
                        id UUID PRIMARY KEY,
                        quiz_id UUID NOT NULL REFERENCES story_quizzes(id) ON DELETE CASCADE,
                        option_key VARCHAR(10) NOT NULL,
                        option_text TEXT NOT NULL,
                        description TEXT,
                        is_correct BOOLEAN NOT NULL DEFAULT FALSE
                    )
                """);

                jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS post_likes (
                        id BIGSERIAL PRIMARY KEY,
                        user_identifier VARCHAR(120) NOT NULL,
                        post_id VARCHAR(120) NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW(),
                        CONSTRAINT uq_post_likes UNIQUE (user_identifier, post_id)
                    )
                """);

                jdbcTemplate.execute("UPDATE feed_items SET video_url = NULL WHERE video_url LIKE '%w3schools%' OR video_url LIKE '%mov_bbb%'");
            } catch (Exception e) {
                log.debug("Column addition check: {}", e.getMessage());
            }

            // 2. Drop any legacy CHECK constraints restricting status or media_type in PostgreSQL
            try {
                jdbcTemplate.execute("""
                            DO $$
                            DECLARE
                                r RECORD;
                            BEGIN
                                FOR r IN (
                                    SELECT conname
                                    FROM pg_constraint
                                    WHERE conrelid = 'stories'::regclass
                                      AND contype = 'c'
                                      AND (pg_get_constraintdef(oid) LIKE '%status%' OR pg_get_constraintdef(oid) LIKE '%media_type%')
                                ) LOOP
                                    EXECUTE 'ALTER TABLE stories DROP CONSTRAINT ' || quote_ident(r.conname);
                                END LOOP;
                            END $$;
                        """);
                log.info("Successfully modernized stories status and media_type check constraints in database.");
                jdbcTemplate.execute("UPDATE stories SET media_type = 'BLOG' WHERE (method = 'WRITTEN' OR body_content IS NOT NULL) AND (media_type IS NULL OR media_type = '' OR media_type = 'blog')");
            } catch (Exception e) {
                log.debug("Constraint/data update check: {}", e.getMessage());
            }

            // 3. Seed audio stories into stories table if none exist
            seedAudioStoriesIfAbsent();
        } catch (Exception e) {
            log.warn("ModerationSchemaInitializer warning: {}", e.getMessage());
        }
    }

    private void seedAudioStoriesIfAbsent() {
        try {
            Integer audioCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM stories WHERE media_type = 'AUDIO' OR method = 'RECORDED' OR media_file_path LIKE '%.mp3' OR media_file_path LIKE '%.m4a'",
                Integer.class
            );

            if (audioCount != null && audioCount >= 4) {
                log.info("Audio stories already present in stories table (count: {})", audioCount);
                return;
            }

            // Find an author ID to link to stories
            java.util.UUID authorId = null;
            try {
                authorId = jdbcTemplate.queryForObject(
                    "SELECT author_id FROM stories WHERE author_id IS NOT NULL LIMIT 1",
                    java.util.UUID.class
                );
            } catch (Exception ignored) {}

            if (authorId == null) {
                try {
                    authorId = jdbcTemplate.queryForObject(
                        "SELECT id FROM users LIMIT 1",
                        java.util.UUID.class
                    );
                } catch (Exception ignored) {}
            }

            if (authorId == null) {
                log.warn("Cannot seed audio stories: no user found in database");
                return;
            }

            log.info("Seeding audio stories into stories table with author ID {}", authorId);

            // 1. PENDING Audio Story (for admin moderation queue review & playback)
            insertAudioStory(
                java.util.UUID.fromString("a0000001-0001-4000-8000-000000000001"),
                authorId,
                "Oral History: Ancient Chants of the Southern Sea",
                "Elder fishermen from Weligama recount maritime oral traditions and rhythmic working chants passed down through four generations.",
                "RECORDED",
                "AUDIO",
                "/uploads/stories/ocean.mp3",
                "audio/mpeg",
                142000L,
                "PENDING",
                "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600",
                "Matara",
                "Southern Province",
                "{Oral Tradition,Ocean Heritage,Folk Music & Songs,Southern Province}",
                0,
                0,
                null
            );

            // 2. PUBLISHED Audio Story (for mobile home page audio card playback)
            insertAudioStory(
                java.util.UUID.fromString("a0000001-0001-4000-8000-000000000002"),
                authorId,
                "Sacred Temple Bells & Heritage Chants of Kandy",
                "Morning bell resonances and ancient Pali blessing chants preserved by the hereditary custodians of the historic highland shrine.",
                "RECORDED",
                "AUDIO",
                "/uploads/stories/bells.mp3",
                "audio/mpeg",
                35000L,
                "PUBLISHED",
                "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=600",
                "Kandy",
                "Central Highlands",
                "{Beliefs & Rituals,Folk Music & Songs,Places & Heritage,Central Highlands}",
                42,
                6,
                java.time.LocalDateTime.now().minusDays(2)
            );

            // 3. PUBLISHED Audio Story (for mobile home page audio card playback)
            insertAudioStory(
                java.util.UUID.fromString("a0000001-0001-4000-8000-000000000003"),
                authorId,
                "Whispers of the Cascading Falls: Sinharaja Forest Lore",
                "Elder forest custodian detailing indigenous herbal knowledge and stream navigation techniques within the virgin Sinharaja canopy.",
                "RECORDED",
                "AUDIO",
                "/uploads/stories/waterfall.mp3",
                "audio/mpeg",
                272000L,
                "PUBLISHED",
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600",
                "Ratnapura",
                "Sabaragamuwa Province",
                "{Nature & Environment,Traditional Knowledge,Oral History}",
                67,
                11,
                java.time.LocalDateTime.now().minusDays(1)
            );

            // 4. PENDING Audio Story (for admin moderation queue review & playback)
            insertAudioStory(
                java.util.UUID.fromString("a0000001-0001-4000-8000-000000000004"),
                authorId,
                "Village Kitchen Memories: Traditional Ambulla Preparation",
                "Elder grandmother Kamalawathi sharing culinary oral history, heirloom spices, and ritual woodstove cooking traditions.",
                "RECORDED",
                "AUDIO",
                "/uploads/stories/ocean.mp3",
                "audio/mpeg",
                142000L,
                "PENDING",
                "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=600",
                "Matara",
                "Southern Province",
                "{Traditional Food,Village Life,Customs & Traditions}",
                0,
                0,
                null
            );

            log.info("Successfully seeded audio stories into stories table.");
        } catch (Exception e) {
            log.warn("Failed to seed audio stories into stories table: {}", e.getMessage());
        }
    }

    private void insertAudioStory(java.util.UUID id, java.util.UUID authorId, String title, String description,
                                  String method, String mediaType, String mediaFilePath, String mediaMimeType,
                                  Long mediaDurationMillis, String status, String imageUrl,
                                  String district, String region, String tags, int likesCount, int commentsCount,
                                  java.time.LocalDateTime publishedAt) {
        try {
            jdbcTemplate.update("""
                INSERT INTO stories (
                    id, author_id, author_user_id, title, description, method, media_type,
                    media_file_path, media_mime_type, media_duration_millis, status,
                    image_url, district, region, tags, likes_count, comments_count,
                    created_at, updated_at, published_at, view_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, 0)
                ON CONFLICT (id) DO UPDATE SET
                    media_type = EXCLUDED.media_type,
                    media_file_path = EXCLUDED.media_file_path,
                    media_duration_millis = EXCLUDED.media_duration_millis,
                    media_mime_type = EXCLUDED.media_mime_type,
                    status = EXCLUDED.status
            """,
            id, authorId, authorId, title, description, method, mediaType,
            mediaFilePath, mediaMimeType, mediaDurationMillis, status,
            imageUrl, district, region, tags, likesCount, commentsCount, publishedAt);
        } catch (Exception e) {
            log.warn("Error inserting audio story {}: {}", title, e.getMessage());
        }
    }
}
