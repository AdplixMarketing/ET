CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(20) NOT NULL,
    status          VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    client_name     VARCHAR(255) NOT NULL,
    client_email    VARCHAR(255),
    issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE NOT NULL,
    notes           TEXT,
    subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate        NUMERIC(5,2) DEFAULT 0,
    tax_amount      NUMERIC(12,2) DEFAULT 0,
    total           NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_date       DATE,
    transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, invoice_number)
);

CREATE TABLE invoice_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
    rate        NUMERIC(12,2) NOT NULL,
    amount      NUMERIC(12,2) NOT NULL,
    sort_order  INT DEFAULT 0
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(user_id, status);
