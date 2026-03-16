CREATE TABLE IF NOT EXISTS import_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename        VARCHAR(255) NOT NULL,
    file_type       VARCHAR(20) NOT NULL CHECK (file_type IN ('csv', 'qbo', 'bank_statement')),
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'preview', 'importing', 'completed', 'failed')),
    column_mapping  JSONB,
    total_rows      INT DEFAULT 0,
    imported_count  INT DEFAULT 0,
    skipped_count   INT DEFAULT 0,
    errors          JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs(user_id);
