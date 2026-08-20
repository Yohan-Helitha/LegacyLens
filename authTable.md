CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    city_id INT REFERENCES cities(id),
    date_of_birth DATE NOT NULL,
    nic_number VARCHAR(20) NOT NULL UNIQUE,
    profile_photo_url VARCHAR(255),
    pin_hash VARCHAR(255) NOT NULL,
    fingerprint_enabled BOOLEAN NOT NULL DEFAULT false,
    failed_pin_attempts INT NOT NULL DEFAULT 0,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    role_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    activated_at TIMESTAMP,
    UNIQUE (user_id, role_type)
);

CREATE TABLE knowledge_holder_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    primary_region VARCHAR(100),
    known_topics TEXT,
    trust_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    skills TEXT,
    interests TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rating NUMERIC(3,2),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

One small note on gen_random_uuid() — it requires the pgcrypto extension. Supabase has this enabled by default, so it should just work, but if the migration errors on that line, add CREATE EXTENSION IF NOT EXISTS pgcrypto; as the very first line of the file.

The Supabase Table Editor is still genuinely useful for one thing: casually browsing data while debugging (e.g. "did that signup actually insert a row?"). Just treat it as a read-mostly viewer, not where schema decisions get made.