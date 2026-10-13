# Technical Decisions — Learning Engine (Member D)

This document records the architectural and design decisions confirmed for the LegacyLens Learning Engine module.

---

### 1. Identity & Data Setup
- **User ID & Table Migration**: `LessonProgress.user_id` is migrated from `Long` (previously parsing phone number) to `UUID` (matching `User.id` from `CustomUserDetails.getUser().getId()`). Existing test records in `lesson_progress` may be discarded and the table recreated.
- **Database Migrations**: Rely on `spring.jpa.hibernate.ddl-auto=update` for rapid iteration. All schema alterations and table definitions are tracked in `docs/learning-engine/SCHEMA.md`.
- **Configuration**: Default properties are placed in `application.properties`, and environment-specific overrides/API keys are documented in `application-local.properties.example`.

### 2. Community Content Source (Stories Adapter)
- **Source Module**: Adapts against the `stories` table (`Story` / `ModerationQueueItem`), as `archive` and `contentcapture` are currently empty in the repository.
- **Text Extraction**: The AI extracts context from `title` + `description` + `body_content`. Media items without text or transcripts are excluded from the AI Study Builder.
- **Status Filter**: Only records with `status = 'PUBLISHED'` (`ModerationStatus.PUBLISHED`) are queryable or usable for generation.
- **Search & Language**: The `SourceContentProvider` adapter executes searches against title/description/body and filters by region and tags. It accommodates mixed Sinhala Unicode and English text.

### 3. AI Provider & Generation Flow
- **AI Provider & Model**: Google Gemini (`gemini-1.5-flash`) utilizing structured JSON mode behind the `AiContentGenerator` interface.
- **Execution Model**: Asynchronous generation via `GenerationJob` (`POST /api/learning/builder/jobs`, polling `GET /api/learning/builder/jobs/{jobId}`) with a 45-second timeout and background worker.
- **Visibility & Integrity**: AI-generated study sets are `PRIVATE` to the creator (`origin = 'AI'`, `owner_user_id = UUID`). They are never listed in admin curation or public track catalogs.
- **Anti-Farming & XP Quotas**: XP is awarded only on the learner's first attempt of an AI set, with a daily AI generation cap (default 5) and daily XP cap (default 60 XP).

### 4. Certificates, UX & Security
- **Certificates**: Backend issues verifiable records with unique verification codes (`IssuedCertificate`). The mobile app renders and prints the certificate as a PDF using an HTML template with `expo-print` to render Sinhala complex scripts natively. A public endpoint `GET /api/learning/certificates/verify/{code}` validates legitimacy.
- **Pronunciation Practice**: Replaced Vosk ASCII-only scoring with a "Record and Playback" workflow where learners record their pronunciation and play it back beside reference audio without misleading score percentages.
- **API Response Wrapper**: Standardize learner endpoints on `ApiResponse<T>`. Existing admin endpoints maintain compatibility with the Angular admin dashboard.
- **Security & Authorization**: Enable `@EnableMethodSecurity` on `SecurityConfig`. Secure admin-only endpoints with `@PreAuthorize("hasRole('ADMIN')")`. Extract learner identities strictly from `@AuthenticationPrincipal CustomUserDetails principal`.
