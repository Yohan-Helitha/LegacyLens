-- ============================================================================
-- LegacyLens Canonical Tag Management & Content Discovery System
-- Migration: V2__canonical_tags_and_discovery.sql
-- Non-destructive, safe to run multiple times
-- ============================================================================

-- 1. Canonical tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name VARCHAR(150) NOT NULL,
    normalized_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    language_code VARCHAR(20) DEFAULT 'en',
    category VARCHAR(50),
    created_by UUID,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Story tags junction table
CREATE TABLE IF NOT EXISTS story_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    confidence DOUBLE PRECISION DEFAULT 1.0,
    assignment_source VARCHAR(30) NOT NULL DEFAULT 'AI',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_story_tags_story_tag UNIQUE (story_id, tag_id)
);

-- 3. Tag aliases table
CREATE TABLE IF NOT EXISTS tag_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    alias VARCHAR(150) NOT NULL,
    normalized_alias VARCHAR(150) NOT NULL UNIQUE,
    language_code VARCHAR(20) DEFAULT 'en',
    alias_type VARCHAR(30) DEFAULT 'SYNONYM',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Tag relationships table
CREATE TABLE IF NOT EXISTS tag_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    target_tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    relationship_type VARCHAR(30) NOT NULL DEFAULT 'RELATED_TO',
    weight DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tag_rel_source_target_type UNIQUE (source_tag_id, target_tag_id, relationship_type),
    CONSTRAINT chk_tag_rel_no_self_ref CHECK (source_tag_id <> target_tag_id)
);

-- 5. Indexes for fast query resolution
CREATE INDEX IF NOT EXISTS idx_tags_normalized_name ON tags(normalized_name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_is_approved ON tags(is_approved);

CREATE INDEX IF NOT EXISTS idx_story_tags_story_id ON story_tags(story_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_tag_id ON story_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_story_tags_source ON story_tags(assignment_source);

CREATE INDEX IF NOT EXISTS idx_tag_aliases_normalized ON tag_aliases(normalized_alias);
CREATE INDEX IF NOT EXISTS idx_tag_aliases_tag_id ON tag_aliases(tag_id);

CREATE INDEX IF NOT EXISTS idx_tag_rel_source ON tag_relationships(source_tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_rel_target ON tag_relationships(target_tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_rel_type ON tag_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_story_views_viewer_viewed ON story_views(viewer_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_viewer ON story_views(story_id, viewer_id);
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories(published_at);

