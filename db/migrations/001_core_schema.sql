CREATE SCHEMA IF NOT EXISTS core;

CREATE TABLE IF NOT EXISTS core.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.agent_runs (
  run_id uuid PRIMARY KEY,
  agent_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS core.tool_calls (
  call_id uuid PRIMARY KEY,
  run_id uuid REFERENCES core.agent_runs(run_id) ON DELETE SET NULL,
  tool text NOT NULL,
  request jsonb NOT NULL DEFAULT '{}'::jsonb,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  ok boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.web_fetches (
  fetch_id uuid PRIMARY KEY,
  url text NOT NULL,
  status_code integer NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  content_hash text,
  title text,
  extracted_text text,
  source_meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS core.artifacts (
  artifact_id uuid PRIMARY KEY,
  run_id uuid REFERENCES core.agent_runs(run_id) ON DELETE SET NULL,
  kind text NOT NULL,
  uri text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON core.agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_created_at ON core.tool_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_web_fetches_url ON core.web_fetches(url);
CREATE INDEX IF NOT EXISTS idx_web_fetches_fetched_at ON core.web_fetches(fetched_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON core.artifacts(created_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'corestack_agent') THEN
    CREATE ROLE corestack_agent NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA core TO corestack_agent;
GRANT SELECT, INSERT, UPDATE ON core.agent_runs TO corestack_agent;
GRANT SELECT, INSERT, UPDATE ON core.tool_calls TO corestack_agent;
GRANT SELECT, INSERT, UPDATE ON core.web_fetches TO corestack_agent;
GRANT SELECT, INSERT, UPDATE ON core.artifacts TO corestack_agent;
