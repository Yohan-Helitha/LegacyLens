package lk.ac.sliit.legacylens.learning.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class LearningSchemaInitializer implements CommandLineRunner {

	private final JdbcTemplate jdbcTemplate;

	@PostConstruct
	public void init() {
		runMigrations();
	}

	@Override
	public void run(String... args) {
		runMigrations();
	}

	private synchronized void runMigrations() {
		try {
			// 1. Columns for learning_tracks
			executeSilently("ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'ADMIN'");
			executeSilently("ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS owner_user_id UUID");
			executeSilently("ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'PUBLIC'");
			executeSilently("ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS source_content_ids TEXT");
			executeSilently("UPDATE learning_tracks SET origin = 'ADMIN' WHERE origin IS NULL");
			executeSilently("UPDATE learning_tracks SET visibility = 'PUBLIC' WHERE visibility IS NULL");

			// 2. Ensure lesson_progress.user_id is UUID (legacy was BIGINT)
			executeSilently("""
				DO $$
				BEGIN
					IF EXISTS (
						SELECT 1 FROM information_schema.columns 
						WHERE table_name = 'lesson_progress' 
						  AND column_name = 'user_id' 
						  AND data_type IN ('bigint', 'integer', 'smallint')
					) THEN
						ALTER TABLE lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_user_id_lesson_id_key;
						ALTER TABLE lesson_progress DROP COLUMN user_id;
						ALTER TABLE lesson_progress ADD COLUMN user_id UUID;
						ALTER TABLE lesson_progress ADD CONSTRAINT uk_lesson_progress_user_lesson UNIQUE (user_id, lesson_id);
					END IF;
				END $$;
			""");

			// 3. Columns for flashcards
			executeSilently("ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS source_content_id VARCHAR(255)");
			executeSilently("ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS evidence TEXT");

			// 4. Columns for quiz_questions
			executeSilently("ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS flashcard_id BIGINT");
			executeSilently("ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS source_content_id VARCHAR(255)");
			executeSilently("ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS evidence TEXT");

			// 5. Tables if not exist
			executeSilently("""
				CREATE TABLE IF NOT EXISTS user_weak_words (
					id BIGSERIAL PRIMARY KEY,
					user_id UUID NOT NULL,
					flashcard_id BIGINT NOT NULL,
					error_count INT NOT NULL DEFAULT 1,
					consecutive_correct INT NOT NULL DEFAULT 0,
					last_failed_at TIMESTAMP NOT NULL DEFAULT NOW(),
					mastered BOOLEAN NOT NULL DEFAULT FALSE,
					next_review_at TIMESTAMP,
					box INT DEFAULT 1,
					CONSTRAINT uk_user_weak_words_user_flashcard UNIQUE (user_id, flashcard_id)
				)
			""");

			executeSilently("""
				CREATE TABLE IF NOT EXISTS study_set_attempts (
					id BIGSERIAL PRIMARY KEY,
					owner_user_id UUID NOT NULL,
					track_id BIGINT NOT NULL,
					lesson_id BIGINT,
					score INT NOT NULL,
					total INT NOT NULL,
					xp_awarded INT NOT NULL DEFAULT 0,
					taken_at TIMESTAMP NOT NULL DEFAULT NOW()
				)
			""");

			executeSilently("""
				CREATE TABLE IF NOT EXISTS issued_certificates (
					id BIGSERIAL PRIMARY KEY,
					user_id UUID NOT NULL,
					track_id BIGINT NOT NULL,
					learner_name_snapshot VARCHAR(255) NOT NULL,
					track_title_snapshot VARCHAR(255) NOT NULL,
					verification_code VARCHAR(64) NOT NULL UNIQUE,
					certificate_type VARCHAR(50) NOT NULL DEFAULT 'ADMIN_TRACK',
					issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
					CONSTRAINT uk_issued_certificates_user_track UNIQUE (user_id, track_id)
				)
			""");

			executeSilently("""
				CREATE TABLE IF NOT EXISTS generation_jobs (
					id BIGSERIAL PRIMARY KEY,
					owner_user_id UUID NOT NULL,
					status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
					requested_artifacts TEXT,
					source_content_ids TEXT,
					failure_reason TEXT,
					result_track_id BIGINT,
					generated_json TEXT,
					input_tokens INT,
					output_tokens INT,
					latency_ms BIGINT,
					created_at TIMESTAMP NOT NULL DEFAULT NOW(),
					completed_at TIMESTAMP
				)
			""");

			log.info("LearningSchemaInitializer: schema columns and tables verified.");
		} catch (Exception e) {
			log.warn("LearningSchemaInitializer warning: {}", e.getMessage());
		}
	}

	private void executeSilently(String sql) {
		try {
			jdbcTemplate.execute(sql);
		} catch (Exception ex) {
			log.debug("Schema migration step notice: {}", ex.getMessage());
		}
	}
}
