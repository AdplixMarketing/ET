-- Add last_reminder_at column for automatic overdue invoice reminders
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;
