# Schema Documentation — Learning Engine (Member D)

All DDL statements and table schemas used by the Learning Engine module in PostgreSQL.

---

### 1. Existing Tables Modified

#### 1.1 `learning_tracks`
Added fields to distinguish admin curated tracks from AI study sets:
```sql
ALTER TABLE learning_tracks
    ADD COLUMN origin VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    ADD COLUMN owner_user_id UUID,
    ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    ADD COLUMN source_content_ids TEXT;

CREATE INDEX idx_learning_tracks_origin_visibility ON learning_tracks(origin, visibility);
CREATE INDEX idx_learning_tracks_owner ON learning_tracks(owner_user_id);
```

#### 1.2 `quiz_questions`
Added link to `flashcards` for weak-word tracking, plus AI grounding fields:
```sql
ALTER TABLE quiz_questions
    ADD COLUMN flashcard_id BIGINT,
    ADD COLUMN source_content_id VARCHAR(100),
    ADD COLUMN evidence TEXT;

ALTER TABLE quiz_questions
    ADD CONSTRAINT fk_quiz_questions_flashcard
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE SET NULL;
```

#### 1.3 `flashcards`
Added AI grounding fields:
```sql
ALTER TABLE flashcards
    ADD COLUMN source_content_id VARCHAR(100),
    ADD COLUMN evidence TEXT;
```

#### 1.4 `lesson_progress` (Recreated)
Recreated with `user_id UUID` (linking to `users.id`):
```sql
DROP TABLE IF EXISTS lesson_progress;

CREATE TABLE lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id BIGINT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    score INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT uk_lesson_progress_user_lesson UNIQUE (user_id, lesson_id),
    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_user_completed ON lesson_progress(user_id, completed);
```

---

### 2. New Tables

#### 2.1 `generation_jobs`
Stores AI Study Builder generation requests and async states:
```sql
CREATE TABLE generation_jobs (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL,
    requested_artifacts TEXT,
    source_content_ids TEXT,
    failure_reason TEXT,
    result_track_id BIGINT,
    generated_json TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_gen_jobs_owner_status ON generation_jobs(owner_user_id, status);
CREATE INDEX idx_gen_jobs_created_at ON generation_jobs(created_at);
```

#### 2.2 `study_set_attempts`
Records attempt history for AI-generated quizzes and track retakes:
```sql
CREATE TABLE study_set_attempts (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id UUID NOT NULL,
    track_id BIGINT NOT NULL,
    lesson_id BIGINT,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    taken_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_set_attempts_owner ON study_set_attempts(owner_user_id, track_id);
```

#### 2.3 `user_weak_words`
Maintains weak words, error counts, and mastery status:
```sql
CREATE TABLE user_weak_words (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    flashcard_id BIGINT NOT NULL,
    error_count INTEGER NOT NULL DEFAULT 1,
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    last_failed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mastered BOOLEAN NOT NULL DEFAULT FALSE,
    next_review_at TIMESTAMP WITHOUT TIME ZONE,
    box INTEGER DEFAULT 1,
    CONSTRAINT uk_user_weak_words_user_flashcard UNIQUE (user_id, flashcard_id),
    CONSTRAINT fk_user_weak_words_flashcard FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

CREATE INDEX idx_weak_words_user_mastered ON user_weak_words(user_id, mastered);
```

#### 2.4 `issued_certificates`
Tracks securely generated and verifiable certificates:
```sql
CREATE TABLE issued_certificates (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    track_id BIGINT NOT NULL,
    learner_name_snapshot VARCHAR(200) NOT NULL,
    track_title_snapshot VARCHAR(200) NOT NULL,
    verification_code VARCHAR(64) NOT NULL UNIQUE,
    certificate_type VARCHAR(50) NOT NULL DEFAULT 'ADMIN_TRACK',
    issued_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_issued_certificates_user_track UNIQUE (user_id, track_id)
);

CREATE INDEX idx_issued_certs_verification_code ON issued_certificates(verification_code);
```
