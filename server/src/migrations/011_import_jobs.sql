CREATE TABLE IF NOT EXISTS import_jobs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL DEFAULT 'csv' CHECK (file_type IN ('csv', 'qbo', 'ofx')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'preview', 'processing', 'completed', 'failed')),
  column_mapping JSONB,
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs(user_id);
