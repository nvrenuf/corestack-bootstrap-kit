CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS signal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    content_type TEXT NOT NULL,
    source_id TEXT NULL,
    url TEXT NOT NULL,
    author TEXT NULL,
    published_at TIMESTAMPTZ NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NULL,
    text_snippet TEXT NULL,
    engagement_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    language TEXT NOT NULL DEFAULT 'en',
    hash TEXT NOT NULL,
    raw_ref_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT signal_items_hash_unique UNIQUE (hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signal_hash
    ON signal_items(hash);

CREATE INDEX IF NOT EXISTS idx_signal_topic_platform
    ON signal_items(topic_id, platform);

CREATE INDEX IF NOT EXISTS idx_signal_published_at
    ON signal_items(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_signal_topic_published
    ON signal_items(topic_id, published_at DESC);

CREATE TABLE IF NOT EXISTS radar_runs (
    run_id UUID PRIMARY KEY,
    topic_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ NULL,
    time_window_days INTEGER NOT NULL,
    collector_versions JSONB NOT NULL DEFAULT '{}'::jsonb,
    counts_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL,
    error_text TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_radar_topic_started
    ON radar_runs(topic_id, started_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ingest_writer') THEN
        CREATE ROLE ingest_writer NOLOGIN;
    END IF;
    ALTER ROLE ingest_writer NOLOGIN;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'synth_reader') THEN
        CREATE ROLE synth_reader NOLOGIN;
    END IF;
    ALTER ROLE synth_reader NOLOGIN;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ingest_api') THEN
        CREATE ROLE ingest_api LOGIN PASSWORD 'ingest_api_pw';
    END IF;
    ALTER ROLE ingest_api LOGIN PASSWORD 'ingest_api_pw';
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'synth_api') THEN
        CREATE ROLE synth_api LOGIN PASSWORD 'synth_api_pw';
    END IF;
    ALTER ROLE synth_api LOGIN PASSWORD 'synth_api_pw';
END$$;

DO $$
BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO ingest_writer', current_database());
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO synth_reader', current_database());
END$$;

GRANT USAGE ON SCHEMA public TO ingest_writer;
GRANT USAGE ON SCHEMA public TO synth_reader;
GRANT ingest_writer TO ingest_api;
GRANT synth_reader TO synth_api;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;

REVOKE ALL PRIVILEGES ON TABLE signal_items FROM ingest_writer;
REVOKE ALL PRIVILEGES ON TABLE radar_runs FROM ingest_writer;
REVOKE ALL PRIVILEGES ON TABLE signal_items FROM synth_reader;
REVOKE ALL PRIVILEGES ON TABLE radar_runs FROM synth_reader;
REVOKE ALL PRIVILEGES ON TABLE signal_items FROM ingest_api;
REVOKE ALL PRIVILEGES ON TABLE radar_runs FROM ingest_api;
REVOKE ALL PRIVILEGES ON TABLE signal_items FROM synth_api;
REVOKE ALL PRIVILEGES ON TABLE radar_runs FROM synth_api;

GRANT INSERT ON TABLE signal_items TO ingest_writer;
GRANT INSERT, UPDATE ON TABLE radar_runs TO ingest_writer;

GRANT SELECT ON TABLE signal_items TO synth_reader;
GRANT SELECT ON TABLE radar_runs TO synth_reader;
