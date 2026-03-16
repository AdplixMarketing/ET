CREATE TABLE IF NOT EXISTS recurring_rules (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type           VARCHAR(20) NOT NULL CHECK (entity_type IN ('transaction', 'invoice')),
    frequency             VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    next_run_date         DATE NOT NULL,
    end_date              DATE,
    is_active             BOOLEAN DEFAULT TRUE,
    transaction_template  JSONB,
    invoice_template_data JSONB,
    last_run_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_user ON recurring_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rules_next ON recurring_rules(next_run_date) WHERE is_active = TRUE;
