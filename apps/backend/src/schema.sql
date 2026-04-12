CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('worker', 'manager')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id                  SERIAL PRIMARY KEY,
  worker_name         TEXT NOT NULL,
  user_id             INTEGER REFERENCES users(id),
  timestamp           TIMESTAMPTZ DEFAULT NOW(),
  tasks_completed     JSONB NOT NULL DEFAULT '[]',
  tasks_in_progress   JSONB NOT NULL DEFAULT '[]',
  blockers            JSONB NOT NULL DEFAULT '[]',
  summary             TEXT NOT NULL DEFAULT '',
  transcript          TEXT NOT NULL DEFAULT '',
  submitted           BOOLEAN DEFAULT false,
  audio_key           TEXT,
  job_id              TEXT,
  processing_status   TEXT DEFAULT 'done'
);

CREATE TABLE IF NOT EXISTS feedback (
  id          SERIAL PRIMARY KEY,
  report_id   INTEGER NOT NULL REFERENCES reports(id),
  accurate    TEXT NOT NULL,
  easier      TEXT NOT NULL,
  comment     TEXT NOT NULL DEFAULT '',
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);
