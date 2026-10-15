-- ============================================================================
-- LegacyLens: Synchronize job_requests into opportunity_audios
-- Automatically feeds elder job requests (audio/text) into the Opportunity
-- Intake queue in the Admin Dashboard.
-- ============================================================================

INSERT INTO public.opportunity_audios (
    id, knowledge_holder_id, elder_name, elder_avatar_url, verified,
    location, recorded_at, duration, audio_url, topic, tags, transcript,
    status, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    jr.elder_id,
    COALESCE(u.full_name, 'Elder Knowledge Keeper'),
    u.profile_photo_url,
    COALESCE(u.phone_verified, true),
    COALESCE(CONCAT(c.name, CASE WHEN c.region IS NOT NULL THEN CONCAT(', ', c.region) ELSE '' END), 'Sri Lanka'),
    COALESCE(jr.created_at, NOW()),
    '02:45',
    COALESCE(NULLIF(jr.voice_note_url, ''), CONCAT('job-request://', jr.id)),
    jr.title,
    'Oral History, Cultural Documentation, Traditional Heritage',
    COALESCE(NULLIF(jr.description, ''), jr.title),
    CASE 
        WHEN jr.status = 'PUBLISHED' THEN 2 
        WHEN jr.status IN ('REJECTED', 'CLOSED') THEN 1 
        ELSE 0 
    END,
    COALESCE(jr.created_at, NOW()),
    NOW()
FROM public.job_requests jr
JOIN public.users u ON jr.elder_id = u.id
LEFT JOIN public.cities c ON u.city_id = c.id
ON CONFLICT (audio_url) DO UPDATE SET
    elder_name = EXCLUDED.elder_name,
    elder_avatar_url = EXCLUDED.elder_avatar_url,
    verified = EXCLUDED.verified,
    location = EXCLUDED.location,
    topic = EXCLUDED.topic,
    transcript = EXCLUDED.transcript,
    updated_at = NOW();

