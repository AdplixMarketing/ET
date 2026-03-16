-- Multi-business support
CREATE TABLE IF NOT EXISTS businesses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    currency      VARCHAR(3) DEFAULT 'USD',
    address       TEXT,
    phone         VARCHAR(50),
    logo_url      VARCHAR(500),
    is_default    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses(user_id);

-- Add business_id FK to all relevant tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'business_id') THEN
    ALTER TABLE transactions ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'business_id') THEN
    ALTER TABLE categories ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'business_id') THEN
    ALTER TABLE invoices ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'business_id') THEN
    ALTER TABLE clients ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_rules' AND column_name = 'business_id') THEN
    ALTER TABLE recurring_rules ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_templates' AND column_name = 'business_id') THEN
    ALTER TABLE invoice_templates ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add default_business_id to users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'default_business_id') THEN
    ALTER TABLE users ADD COLUMN default_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
  END IF;
END $$;
