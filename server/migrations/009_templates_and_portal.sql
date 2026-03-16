-- Invoice templates
CREATE TABLE IF NOT EXISTS invoice_templates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    primary_color    VARCHAR(7) DEFAULT '#4A90E2',
    secondary_color  VARCHAR(7) DEFAULT '#1C1C1E',
    logo_url         VARCHAR(500),
    layout           VARCHAR(20) DEFAULT 'standard',
    footer_text      TEXT,
    custom_fields    JSONB DEFAULT '[]',
    hide_branding    BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_templates_user ON invoice_templates(user_id);

-- Add template and portal columns to invoices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'template_id') THEN
    ALTER TABLE invoices ADD COLUMN template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'portal_token') THEN
    ALTER TABLE invoices ADD COLUMN portal_token VARCHAR(64) UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'portal_payment_enabled') THEN
    ALTER TABLE invoices ADD COLUMN portal_payment_enabled BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE invoices ADD COLUMN stripe_payment_intent_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'processing_fee') THEN
    ALTER TABLE invoices ADD COLUMN processing_fee NUMERIC(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'portal_expires_at') THEN
    ALTER TABLE invoices ADD COLUMN portal_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Stripe Connect columns on users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_connect_account_id') THEN
    ALTER TABLE users ADD COLUMN stripe_connect_account_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_connect_onboarded') THEN
    ALTER TABLE users ADD COLUMN stripe_connect_onboarded BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
