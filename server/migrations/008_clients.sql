CREATE TABLE IF NOT EXISTS clients (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255),
    phone      VARCHAR(50),
    company    VARCHAR(255),
    address    TEXT,
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);

-- Add client_id FK to invoices and transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'client_id') THEN
    ALTER TABLE invoices ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'client_id') THEN
    ALTER TABLE transactions ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;
