CREATE TABLE IF NOT EXISTS automation_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_type       VARCHAR(30) NOT NULL CHECK (rule_type IN ('auto_categorize', 'duplicate_detect')),
    name            VARCHAR(255) NOT NULL,
    match_field     VARCHAR(50) DEFAULT 'vendor_or_client',
    match_value     VARCHAR(255) NOT NULL,
    match_type      VARCHAR(20) DEFAULT 'contains' CHECK (match_type IN ('exact', 'contains', 'starts_with')),
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_user ON automation_rules(user_id);
