CREATE TABLE IF NOT EXISTS transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
    date             DATE NOT NULL,
    description      VARCHAR(500),
    vendor_or_client VARCHAR(255),
    payment_method   VARCHAR(50),
    notes            TEXT,
    receipt_path     VARCHAR(500),
    ocr_raw_text     TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);
