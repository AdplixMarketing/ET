-- Performance indexes for frequently queried columns

-- Transactions: speed up monthly counts, date queries, client lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_receipt ON transactions(user_id) WHERE receipt_path IS NOT NULL;

-- Invoice items: speed up JOIN on invoice_id (eliminates sequential scans)
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Invoices: speed up client-based lookups and status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_portal_token ON invoices(portal_token) WHERE portal_token IS NOT NULL;

-- Clients: speed up user-scoped queries
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);

-- Automation rules: speed up active rule lookups
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_active ON automation_rules(user_id) WHERE is_active = TRUE;

-- Audit logs: speed up user lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
