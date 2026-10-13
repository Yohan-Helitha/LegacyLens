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

            // 2. Drop any legacy CHECK constraints restricting status in PostgreSQL
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
                                      AND pg_get_constraintdef(oid) LIKE '%status%'
                                ) LOOP
                                    EXECUTE 'ALTER TABLE stories DROP CONSTRAINT ' || quote_ident(r.conname);
                                END LOOP;
                            END $$;
                        """);
                log.info("Successfully modernized stories status check constraints in database.");
            } catch (Exception e) {
                log.debug("Constraint update check: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.warn("ModerationSchemaInitializer warning: {}", e.getMessage());
        }
    }
}
